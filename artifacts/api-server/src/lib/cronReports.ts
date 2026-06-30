import cron from 'node-cron';
import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { logger } from './logger.js';

// ── Firebase Admin init ────────────────────────────────────────────────────
function getAdminDb() {
  if (getApps().length === 0) {
    const sa = process.env['FIREBASE_SERVICE_ACCOUNT'];
    if (!sa) {
      logger.warn('[CronReports] FIREBASE_SERVICE_ACCOUNT env var not set — cron disabled');
      return null;
    }
    try {
      initializeApp({ credential: cert(JSON.parse(sa)) });
    } catch (e) {
      logger.error({ err: e }, '[CronReports] Firebase Admin init failed');
      return null;
    }
  }
  return getFirestore(getApp());
}

// ── Helpers ───────────────────────────────────────────────────────────────
function daysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}
function padDate(n: number) { return String(n).padStart(2, '0'); }

function isLastDayOfMonth(): boolean {
  // IST = UTC+5:30
  const istNow = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const y = istNow.getUTCFullYear();
  const m = istNow.getUTCMonth() + 1;
  const d = istNow.getUTCDate();
  return d === daysInMonth(m, y);
}

function getISTDate(): { year: number; month: number } {
  const istNow = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return { year: istNow.getUTCFullYear(), month: istNow.getUTCMonth() + 1 };
}

// ── Report generation ─────────────────────────────────────────────────────
async function generateMonthlyReport() {
  const db = getAdminDb();
  if (!db) return;

  if (!isLastDayOfMonth()) {
    logger.info('[CronReports] Not last day of month — skipping');
    return;
  }

  const { year, month } = getISTDate();
  const mm = padDate(month);
  const startDate = `${year}-${mm}-01`;
  const totalDays = daysInMonth(month, year);
  const endDate   = `${year}-${mm}-${padDate(totalDays)}`;
  const reportId  = `RPT-M-${year}-${mm}-AUTO`;

  logger.info(`[CronReports] Generating monthly report ${reportId} for ${startDate} → ${endDate}`);

  try {
    // Check if already generated
    const existing = await db.collection('reportHistory').doc(reportId).get();
    if (existing.exists) {
      logger.info(`[CronReports] Report ${reportId} already exists — skipping`);
      return;
    }

    // Read all required data in parallel
    const [housesSnap, houseVisitsSnap, wardsSnap, recipientsSnap] = await Promise.all([
      db.collection('houses').get(),
      db.collection('houseVisits')
        .where('visitDate', '>=', startDate)
        .where('visitDate', '<=', endDate)
        .get(),
      db.collection('wards').get(),
      db.collection('settings').doc('reportRecipients').get(),
    ]);

    const houses     = housesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
    const houseVisits = houseVisitsSnap.docs.map(d => d.data()) as any[];
    const dayHeaders = Array.from({ length: totalDays }, (_, i) => i + 1);

    // Build rows
    const rows = houses.map((house: any, idx: number) => {
      const visits = houseVisits.filter((v: any) => v.houseId === house.id);
      const dailyStatus: Record<number, string> = {};
      let totalPresent = 0, totalAbsent = 0, totalLate = 0;

      for (const day of dayHeaders) {
        const dateStr = `${year}-${mm}-${padDate(day)}`;
        const visit = visits.find((v: any) => v.visitDate === dateStr);
        let status = 'N';
        if (visit && visit.collectedGarbage) {
          status = visit.isLate ? 'L' : 'P';
        }
        dailyStatus[day] = status;
        if (status === 'P') totalPresent++;
        else if (status === 'L') { totalLate++; totalPresent++; }
        else totalAbsent++;
      }

      const pct = dayHeaders.length > 0
        ? ((totalPresent / dayHeaders.length) * 100).toFixed(2) + '%'
        : '0%';

      return {
        sNo: idx + 1,
        houseId: house.id,
        houseRegNo: house.registrationNumber ?? '',
        wardNo: house.wardNumber ?? '',
        dailyStatus,
        totalPresent,
        totalAbsent,
        totalLate,
        totalDays: dayHeaders.length,
        percentage: pct,
      };
    });

    const MONTH_NAMES = ['January','February','March','April','May','June',
      'July','August','September','October','November','December'];

    const report = {
      id: reportId,
      type: 'monthly',
      label: `${MONTH_NAMES[month - 1]} ${year} (Auto)`,
      year, month,
      wardId: null, wardNumber: null,
      generatedAt: new Date().toISOString(),
      generatedBy: 'auto',
      rowCount: rows.length,
      rows,
      daysInPeriod: totalDays,
      dayHeaders,
    };

    // Write report to Firestore
    await db.collection('reportHistory').doc(reportId).set(report);

    // Write distribution record for recipients
    const recipientIds: string[] = recipientsSnap.exists
      ? (recipientsSnap.data()?.userIds ?? [])
      : [];

    if (recipientIds.length > 0) {
      const totP = rows.reduce((a: number, r: any) => a + r.totalPresent, 0);
      const totN = rows.reduce((a: number, r: any) => a + r.totalAbsent, 0);
      await db.collection('reportDistributions').doc(reportId).set({
        reportId, label: report.label, type: 'monthly', year, month,
        rowCount: rows.length, collected: totP, missed: totN,
        sentAt: new Date().toISOString(), recipients: recipientIds,
        autoGenerated: true,
      });
    }

    logger.info(`[CronReports] ✅ Report ${reportId} saved — ${rows.length} houses, ${recipientIds.length} recipients`);
  } catch (e) {
    logger.error({ err: e }, `[CronReports] ❌ Failed to generate report ${reportId}`);
  }
}

// ── Schedule ──────────────────────────────────────────────────────────────
// Runs at 3:30 PM UTC = 9:00 PM IST, on days 28–31 (checks for last day in callback)
export function startCronJobs() {
  const sa = process.env['FIREBASE_SERVICE_ACCOUNT'];
  if (!sa) {
    logger.warn('[CronReports] FIREBASE_SERVICE_ACCOUNT not set — auto report cron disabled. Set this secret to enable.');
    return;
  }

  // 6-field cron: seconds=0, min=30, hour=15, day=28-31, month=*, weekday=*
  cron.schedule('0 30 15 28-31 * *', () => {
    logger.info('[CronReports] Cron triggered — checking if last day of month...');
    generateMonthlyReport().catch(e => logger.error({ err: e }, '[CronReports] Unhandled error'));
  }, { timezone: 'UTC' });

  logger.info('[CronReports] Monthly auto-report cron scheduled (9 PM IST / 3:30 PM UTC, last day of month)');
}
