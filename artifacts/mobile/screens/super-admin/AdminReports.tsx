import { Feather } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  ActivityIndicator, Modal, Platform, Pressable, ScrollView, Share, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { collection, doc, getDocs, limit, orderBy, query, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAlert } from '@/contexts/AlertContext';
import { useAppData } from '@/contexts/AppContext';
import type {
  CollectionStatus, GeneratedReport, HouseCollectionRow, ReportType, WeekHeader,
} from '@/types';

type HistoryEntry = {
  id: string; type: ReportType; label: string; year: number; month?: number;
  quarter?: number; wardId: string | null; wardNumber?: number | null;
  generatedAt: string; rowCount: number; generatedBy: 'auto' | 'manual';
};

// ── Design tokens ─────────────────────────────────────────────────────
const BG       = '#060B18';
const GLASS    = 'rgba(255,255,255,0.06)';
const GLASS_HI = 'rgba(255,255,255,0.10)';
const GLASS_BD = 'rgba(255,255,255,0.10)';
const TEXT     = '#F0F4FF';
const MUTED    = 'rgba(255,255,255,0.42)';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const QUARTER_LABELS = ['Q1 (Jan–Mar)', 'Q2 (Apr–Jun)', 'Q3 (Jul–Sep)', 'Q4 (Oct–Dec)'];

type RTab = 'monthly' | 'quarterly' | 'yearly';
const REPORT_TABS: { key: RTab; label: string; icon: string; color: string; grad: readonly [string,string] }[] = [
  { key: 'monthly',   label: 'Monthly',   icon: 'calendar',    color: '#22D3EE', grad: ['#0EA5E9','#0284C7'] },
  { key: 'quarterly', label: 'Quarterly', icon: 'bar-chart-2', color: '#A78BFA', grad: ['#7C3AED','#4F46E5'] },
  { key: 'yearly',    label: 'Yearly',    icon: 'trending-up', color: '#34D399', grad: ['#10B981','#059669'] },
] as const;

// ── Helpers ────────────────────────────────────────────────────────────
function daysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

function padDate(n: number) { return String(n).padStart(2, '0'); }

function getStatusColor(s: CollectionStatus) {
  if (s === 'P') return '#34D399';
  if (s === 'L') return '#FBBF24';
  return '#FB7185';
}

// IST check: last day of month, after 9 PM IST
function shouldAutoGenerate(year: number, month: number): boolean {
  const now = new Date();
  // IST = UTC+5:30
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);
  const lastDay = daysInMonth(month, year);
  return (
    istNow.getFullYear() === year &&
    istNow.getMonth() + 1 === month &&
    istNow.getDate() === lastDay &&
    istNow.getHours() >= 21
  );
}

// ── Main Component ─────────────────────────────────────────────────────
export default function AdminReports() {
  const { houses, wards, houseVisits, attendance, users, complaints } = useAppData();
  const { showAlert } = useAlert();

  const now = new Date();
  const [tab, setTab]             = useState<RTab>('monthly');
  const [selYear, setSelYear]     = useState(now.getFullYear());
  const [selMonth, setSelMonth]   = useState(now.getMonth() + 1);
  const [selQuarter, setSelQuarter] = useState(Math.ceil((now.getMonth() + 1) / 3));
  const [selWardId, setSelWardId] = useState<string | null>(null);
  const [report, setReport]       = useState<GeneratedReport | null>(null);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [autoGenDone, setAutoGenDone] = useState(false);
  const [reportHistory, setReportHistory] = useState<GeneratedReport[]>([]);
  const [historyMeta, setHistoryMeta]     = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory]     = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'auto' | 'manual'>('all');
  const [selIds, setSelIds]               = useState<Set<string>>(new Set());
  const [deleting, setDeleting]           = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showRecipientsModal, setShowRecipientsModal] = useState(false);
  const [reportRecipients, setReportRecipients]       = useState<string[]>([]);
  const [savingRecipients, setSavingRecipients]       = useState(false);
  const [recipientDraft, setRecipientDraft]           = useState<string[]>([]);
  const [countdown, setCountdown]                     = useState('');

  // ── Live countdown to next auto-generate ──────────────────────────
  useEffect(() => {
    function calcCountdown() {
      const now = new Date();
      const istNow = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
      const y = istNow.getUTCFullYear();
      const m = istNow.getUTCMonth() + 1;
      const lastD = daysInMonth(m, y);
      // 9 PM IST = 15:30 UTC
      const target = new Date(Date.UTC(y, m - 1, lastD, 15, 30, 0));
      const diff = target.getTime() - now.getTime();
      const MNAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      if (diff <= 0) { setCountdown(`${lastD} ${MNAMES[m-1]} · Generating...`); return; }
      const days  = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins  = Math.floor((diff % 3600000) / 60000);
      const secs  = Math.floor((diff % 60000) / 1000);
      const parts = [days > 0 ? `${days}d` : null, `${String(hours).padStart(2,'0')}h`, `${String(mins).padStart(2,'0')}m`, `${String(secs).padStart(2,'0')}s`].filter(Boolean).join(' ');
      setCountdown(`${lastD} ${MNAMES[m-1]} · 9:00 PM IST · ${parts} left`);
    }
    calcCountdown();
    const timer = setInterval(calcCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Load history + recipients from Firestore on mount ─────────────
  useEffect(() => {
    (async () => {
      setHistoryLoading(true);
      try {
        const snap = await getDocs(query(collection(db, 'reportHistory'), orderBy('generatedAt', 'desc'), limit(30)));
        setHistoryMeta(snap.docs.map(d => d.data() as HistoryEntry));
      } catch { /* silent */ } finally { setHistoryLoading(false); }
    })();
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'settings')));
        const recDoc = snap.docs.find(d => d.id === 'reportRecipients');
        if (recDoc) setReportRecipients((recDoc.data().userIds ?? []) as string[]);
      } catch { /* silent */ }
    })();
  }, []);

  // ── Auto-generate on last day at 9 PM IST ─────────────────────────
  useEffect(() => {
    if (tab === 'monthly' && !autoGenDone && shouldAutoGenerate(selYear, selMonth)) {
      setAutoGenDone(true);
      handleGenerate(true);
    }
  }, [tab, selYear, selMonth]);

  // ── Core: build HouseCollectionRow list ───────────────────────────
  const buildRows = useCallback((
    houseList: typeof houses,
    days: number[],
    startDate: string,
    endDate: string,
  ): HouseCollectionRow[] => {
    return houseList.map((house, idx) => {
      const visits = houseVisits.filter(v =>
        v.houseId === house.id &&
        v.visitDate >= startDate &&
        v.visitDate <= endDate
      );
      const dailyStatus: Record<number, CollectionStatus> = {};
      let totalPresent = 0;
      let totalAbsent  = 0;
      let totalLate    = 0;

      for (const day of days) {
        const dateStr = `${startDate.slice(0, 4)}-${startDate.slice(5, 7)}-${padDate(day)}`;
        const visit = visits.find(v => v.visitDate === dateStr);
        let status: CollectionStatus = 'N';
        if (visit && visit.collectedGarbage) {
          status = visit.isLate ? 'L' : 'P';
        }
        dailyStatus[day] = status;
        if (status === 'P') totalPresent++;
        else if (status === 'L') { totalLate++; totalPresent++; }
        else totalAbsent++;
      }

      const collected = totalPresent; // P + L both count as collected
      const pct = days.length > 0 ? ((collected / days.length) * 100).toFixed(2) + '%' : '0%';

      return {
        sNo: idx + 1,
        houseId: house.id,
        houseRegNo: house.registrationNumber,
        wardNo: house.wardNumber,
        dailyStatus,
        totalPresent,
        totalAbsent,
        totalLate,
        totalDays: days.length,
        percentage: pct,
      };
    });
  }, [houseVisits]);

  // ── Generate monthly report ────────────────────────────────────────
  function buildMonthlyReport(year: number, month: number, wardId: string | null): GeneratedReport {
    const totalDays = daysInMonth(month, year);
    const dayHeaders = Array.from({ length: totalDays }, (_, i) => i + 1);
    const mm = padDate(month);
    const startDate = `${year}-${mm}-01`;
    const endDate   = `${year}-${mm}-${padDate(totalDays)}`;

    const houseList = wardId ? houses.filter(h => h.wardId === wardId) : houses;
    const ward = wardId ? wards.find(w => w.id === wardId) : null;

    return {
      id: `RPT-M-${year}-${mm}${wardId ? `-W${ward?.wardNumber}` : ''}`,
      type: 'monthly',
      label: `${MONTH_NAMES[month - 1]} ${year}${ward ? ` · Ward ${ward.wardNumber}` : ''}`,
      year, month,
      wardId, wardNumber: ward?.wardNumber ?? null,
      generatedAt: new Date().toISOString(),
      rows: buildRows(houseList, dayHeaders, startDate, endDate),
      daysInPeriod: totalDays,
      dayHeaders,
    };
  }

  // ── Generate quarterly report (WEEK-WISE) ─────────────────────────
  function buildQuarterlyReport(year: number, quarter: number, wardId: string | null): GeneratedReport {
    const startMonth = (quarter - 1) * 3 + 1;
    const endMonth   = startMonth + 2;
    const startDate  = `${year}-${padDate(startMonth)}-01`;
    const endDays    = daysInMonth(endMonth, year);
    const endDate    = `${year}-${padDate(endMonth)}-${padDate(endDays)}`;

    const houseList = wardId ? houses.filter(h => h.wardId === wardId) : houses;
    const ward = wardId ? wards.find(w => w.id === wardId) : null;

    // Build week headers across all 3 months (W1=days1-7, W2=8-14, W3=15-21, W4=22-28, W5=29+)
    const weekHeaders: WeekHeader[] = [];
    for (let m = startMonth; m <= endMonth; m++) {
      const dInM = daysInMonth(m, year);
      const numWeeks = Math.ceil(dInM / 7);
      for (let w = 1; w <= numWeeks; w++) {
        const wStart = (w - 1) * 7 + 1;
        const wEnd   = Math.min(w * 7, dInM);
        weekHeaders.push({
          key:       `${m}-W${w}`,
          label:     `${MONTH_NAMES[m - 1].slice(0, 3)}-W${w}`,
          totalDays: wEnd - wStart + 1,
        });
      }
    }

    const rows: HouseCollectionRow[] = houseList.map((house, idx) => {
      const visits = houseVisits.filter(v =>
        v.houseId === house.id &&
        v.visitDate >= startDate &&
        v.visitDate <= endDate
      );
      let totalPresent = 0, totalAbsent = 0, totalLate = 0, totalDays = 0;
      const weeklyCollected: Record<string, number> = {};
      const weeklyTotal:     Record<string, number> = {};

      for (let m = startMonth; m <= endMonth; m++) {
        const dInM     = daysInMonth(m, year);
        const numWeeks = Math.ceil(dInM / 7);
        for (let w = 1; w <= numWeeks; w++) {
          const wStart = (w - 1) * 7 + 1;
          const wEnd   = Math.min(w * 7, dInM);
          const key    = `${m}-W${w}`;
          let wCollected = 0;
          for (let day = wStart; day <= wEnd; day++) {
            totalDays++;
            const dateStr = `${year}-${padDate(m)}-${padDate(day)}`;
            const visit = visits.find(v => v.visitDate === dateStr);
            if (visit && visit.collectedGarbage) {
              wCollected++;
              if (visit.isLate) { totalLate++; totalPresent++; }
              else totalPresent++;
            } else totalAbsent++;
          }
          weeklyCollected[key] = wCollected;
          weeklyTotal[key]     = wEnd - wStart + 1;
        }
      }

      const pct = totalDays > 0 ? ((totalPresent / totalDays) * 100).toFixed(2) + '%' : '0%';
      return {
        sNo: idx + 1, houseId: house.id,
        houseRegNo: house.registrationNumber, wardNo: house.wardNumber,
        dailyStatus: {}, totalPresent, totalAbsent, totalLate, totalDays, percentage: pct,
        weeklyCollected, weeklyTotal,
      };
    });

    return {
      id: `RPT-Q${quarter}-${year}${wardId ? `-W${ward?.wardNumber}` : ''}`,
      type: 'quarterly',
      label: `${QUARTER_LABELS[quarter - 1]} ${year}${ward ? ` · Ward ${ward.wardNumber}` : ''}`,
      year, quarter, wardId, wardNumber: ward?.wardNumber ?? null,
      generatedAt: new Date().toISOString(),
      rows,
      daysInPeriod: weekHeaders.reduce((a, wh) => a + wh.totalDays, 0),
      dayHeaders: [],
      weekHeaders,
    };
  }

  // ── Generate yearly report (MONTHLY COLUMNS) ──────────────────────
  function buildYearlyReport(year: number, wardId: string | null): GeneratedReport {
    const houseList = wardId ? houses.filter(h => h.wardId === wardId) : houses;
    const ward = wardId ? wards.find(w => w.id === wardId) : null;
    const startDate = `${year}-01-01`;
    const endDate   = `${year}-12-31`;

    let totalDaysInYear = 0;
    for (let m = 1; m <= 12; m++) totalDaysInYear += daysInMonth(m, year);

    const rows: HouseCollectionRow[] = houseList.map((house, idx) => {
      const visits = houseVisits.filter(v =>
        v.houseId === house.id &&
        v.visitDate >= startDate &&
        v.visitDate <= endDate
      );
      let totalPresent = 0, totalAbsent = 0, totalLate = 0;
      const monthlyData: Record<number, { p: number; n: number; l: number }> = {};

      for (let m = 1; m <= 12; m++) {
        const dInM = daysInMonth(m, year);
        let mp = 0, mn = 0, ml = 0;
        for (let day = 1; day <= dInM; day++) {
          const dateStr = `${year}-${padDate(m)}-${padDate(day)}`;
          const visit = visits.find(v => v.visitDate === dateStr);
          if (visit && visit.collectedGarbage) {
            if (visit.isLate) { ml++; totalLate++; totalPresent++; mp++; }
            else { mp++; totalPresent++; }
          } else { mn++; totalAbsent++; }
        }
        monthlyData[m] = { p: mp, n: mn, l: ml };
      }

      const pct = totalDaysInYear > 0 ? ((totalPresent / totalDaysInYear) * 100).toFixed(2) + '%' : '0%';
      return {
        sNo: idx + 1, houseId: house.id,
        houseRegNo: house.registrationNumber, wardNo: house.wardNumber,
        dailyStatus: {}, totalPresent, totalAbsent, totalLate,
        totalDays: totalDaysInYear, percentage: pct,
        monthlyData,
      };
    });

    return {
      id: `RPT-Y${year}${wardId ? `-W${ward?.wardNumber}` : ''}`,
      type: 'yearly',
      label: `Year ${year}${ward ? ` · Ward ${ward.wardNumber}` : ''}`,
      year, wardId, wardNumber: ward?.wardNumber ?? null,
      generatedAt: new Date().toISOString(),
      rows, daysInPeriod: totalDaysInYear, dayHeaders: [],
    };
  }

  async function handleGenerate(silent = false) {
    setGenerating(true);
    try {
      await new Promise(r => setTimeout(r, 300));
      let rpt: GeneratedReport;
      if (tab === 'monthly')        rpt = buildMonthlyReport(selYear, selMonth, selWardId);
      else if (tab === 'quarterly') rpt = buildQuarterlyReport(selYear, selQuarter, selWardId);
      else                          rpt = buildYearlyReport(selYear, selWardId);
      setReport(rpt);
      setReportHistory(prev => [rpt, ...prev.filter(r => r.id !== rpt.id)].slice(0, 20));
      const entry: HistoryEntry = {
        id: rpt.id, type: rpt.type, label: rpt.label, year: rpt.year,
        ...(rpt.month    != null ? { month: Number(rpt.month) }     : {}),
        ...(rpt.quarter  != null ? { quarter: Number(rpt.quarter) } : {}),
        wardId: rpt.wardId ?? null,
        wardNumber: rpt.wardNumber != null ? Number(rpt.wardNumber) : null,
        generatedAt: rpt.generatedAt, rowCount: rpt.rows.length,
        generatedBy: silent ? 'auto' : 'manual',
      };
      // Strip any undefined values before Firestore write
      const safeEntry = JSON.parse(JSON.stringify(entry)) as HistoryEntry;
      setHistoryMeta(prev => [safeEntry, ...prev.filter(h => h.id !== safeEntry.id)].slice(0, 30));
      await setDoc(doc(db, 'reportHistory', rpt.id), safeEntry).catch(e => console.warn('reportHistory save failed:', e));
      if (silent) sendToRecipients(rpt, reportRecipients);
      if (!silent) showAlert('Report Ready', rpt.label, undefined, 'success');
    } finally { setGenerating(false); }
  }

  // ── Delete history entries ─────────────────────────────────────────
  async function deleteSelected(ids: string[]) {
    setDeleting(true);
    try {
      const batch = writeBatch(db);
      ids.forEach(id => batch.delete(doc(db, 'reportHistory', id)));
      await batch.commit();
      setHistoryMeta(prev => prev.filter(h => !ids.includes(h.id)));
      setReportHistory(prev => prev.filter(r => !ids.includes(r.id)));
      setSelIds(new Set());
      showAlert('Deleted', `${ids.length} report${ids.length > 1 ? 's' : ''} removed.`, undefined, 'success');
    } catch (e: any) { showAlert('Delete Failed', e?.message ?? 'Unknown error', undefined, 'error'); }
    finally { setDeleting(false); }
  }

  function toggleSel(id: string) {
    setSelIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }

  // ── Normal share (native share sheet) ─────────────────────────────
  async function handleNormalShare(rpt: GeneratedReport = report!) {
    if (!rpt) return;
    const totP = rpt.rows.reduce((a, r) => a + r.totalPresent, 0);
    const totN = rpt.rows.reduce((a, r) => a + r.totalAbsent, 0);
    const totAll = totP + totN;
    const avg = totAll > 0 ? ((totP / totAll) * 100).toFixed(1) + '%' : '—';
    const msg = `📊 DNP360 Report — ${rpt.label}\n\n🏠 Houses: ${rpt.rows.length}\n✅ Collected: ${totP}\n❌ Missed: ${totN}\n📈 Avg: ${avg}\n\n📅 Generated: ${new Date(rpt.generatedAt).toLocaleString('en-IN')}\n\nNagar Parishad Daudnagar`;
    try { await Share.share({ message: msg, title: `DNP360 — ${rpt.label}` }); } catch { /* user cancelled */ }
    setShowShareMenu(false);
  }

  // ── Save report recipients to Firestore ───────────────────────────
  async function saveReportRecipients(ids: string[]) {
    setSavingRecipients(true);
    try {
      await setDoc(doc(db, 'settings', 'reportRecipients'), { userIds: ids, updatedAt: new Date().toISOString() });
      setReportRecipients(ids);
      showAlert('Saved', `${ids.length} recipient${ids.length !== 1 ? 's' : ''} will receive auto-generated reports.`, undefined, 'success');
    } catch (e: any) { showAlert('Save Failed', e?.message ?? 'Unknown error', undefined, 'error'); }
    finally { setSavingRecipients(false); }
  }

  // ── Auto-distribute report to saved recipients ────────────────────
  async function sendToRecipients(rpt: GeneratedReport, recipientIds: string[]) {
    if (recipientIds.length === 0) return;
    try {
      const batch = writeBatch(db);
      const totP = rpt.rows.reduce((a, r) => a + r.totalPresent, 0);
      const totN = rpt.rows.reduce((a, r) => a + r.totalAbsent, 0);
      const payload = {
        reportId: rpt.id, label: rpt.label, type: rpt.type, year: rpt.year,
        ...(rpt.month   != null ? { month: rpt.month }     : {}),
        ...(rpt.quarter != null ? { quarter: rpt.quarter } : {}),
        rowCount: rpt.rows.length, collected: totP, missed: totN,
        sentAt: new Date().toISOString(), recipients: recipientIds,
      };
      batch.set(doc(db, 'reportDistributions', rpt.id), payload);
      await batch.commit();
    } catch (e) { console.warn('sendToRecipients failed:', e); }
  }

  // ── Export to Excel (.xlsx) ────────────────────────────────────────
  async function handleExport() {
    if (!report) return;
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) { showAlert('Not Supported', 'Sharing is not available on this device.', undefined, 'error'); return; }
    setExporting(true);
    try {
      const wb = XLSX.utils.book_new();
      const aoaData: (string | number)[][] = [];

      if (report.type === 'monthly') {
        aoaData.push(['S.No', 'House Reg No', 'Ward No', ...report.dayHeaders.map(String), 'P', 'N', 'L', '%']);
        for (const row of report.rows) {
          const dayCells = report.dayHeaders.map(d => row.dailyStatus[d] ?? 'N');
          aoaData.push([row.sNo, row.houseRegNo, row.wardNo, ...dayCells, row.totalPresent, row.totalAbsent, row.totalLate, row.percentage]);
        }
      } else if (report.type === 'quarterly') {
        const wh = report.weekHeaders ?? [];
        aoaData.push(['S.No', 'House Reg No', 'Ward No', ...wh.map(h => h.label), 'P', 'N', 'L', '%']);
        for (const row of report.rows) {
          const wkCells = wh.map(h => {
            const col = row.weeklyCollected?.[h.key] ?? 0;
            const tot = row.weeklyTotal?.[h.key] ?? h.totalDays;
            return `${col}/${tot}`;
          });
          aoaData.push([row.sNo, row.houseRegNo, row.wardNo, ...wkCells, row.totalPresent, row.totalAbsent, row.totalLate, row.percentage]);
        }
      } else {
        // Yearly: monthly columns
        aoaData.push(['S.No', 'House Reg No', 'Ward No', ...MONTH_NAMES.map(m => m.slice(0, 3)), 'P', 'N', 'L', '%']);
        for (const row of report.rows) {
          const mCells = Array.from({ length: 12 }, (_, i) => row.monthlyData?.[i + 1]?.p ?? 0);
          aoaData.push([row.sNo, row.houseRegNo, row.wardNo, ...mCells, row.totalPresent, row.totalAbsent, row.totalLate, row.percentage]);
        }
      }

      // Summary sheet
      const totP = report.rows.reduce((a, r) => a + r.totalPresent, 0);
      const totN = report.rows.reduce((a, r) => a + r.totalAbsent, 0);
      const totL = report.rows.reduce((a, r) => a + r.totalLate, 0);
      const summaryAoa: (string | number)[][] = [
        ['Report', report.label],
        ['Generated At', new Date(report.generatedAt).toLocaleString('en-IN')],
        ['Total Houses', report.rows.length],
        ['Total Collected', totP],
        ['Total Missed', totN],
        ['Total Late', totL],
        ['Avg %', report.rows.length > 0 ? (((totP / (totP + totN)) || 0) * 100).toFixed(2) + '%' : '0%'],
      ];

      const ws = XLSX.utils.aoa_to_sheet(aoaData);
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoa);
      XLSX.utils.book_append_sheet(wb, ws, 'Collection Data');
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

      const filename = `DNP360_${report.id}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      if (Platform.OS === 'web') {
        XLSX.writeFile(wb, filename);
      } else {
        const xlsxBase64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
        const path = FileSystem.cacheDirectory + filename;
        await FileSystem.writeAsStringAsync(path, xlsxBase64, { encoding: FileSystem.EncodingType.Base64 });
        await Sharing.shareAsync(path, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: `Export: ${report.label}`,
          UTI: 'com.microsoft.excel.xlsx',
        });
      }
    } catch (e: any) { showAlert('Export Failed', e?.message ?? 'Unknown error', undefined, 'error'); }
    finally { setExporting(false); }
  }

  // ── Export to PDF ──────────────────────────────────────────────────
  async function handleExportPDF(rpt: GeneratedReport = report!) {
    if (!rpt) return;
    if (Platform.OS !== 'web') {
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) { showAlert('Not Supported', 'Sharing is not available on this device.', undefined, 'error'); return; }
    }
    setExportingPDF(true);
    try {
      // ── Core stats ─────────────────────────────────────────────────
      const totP   = rpt.rows.reduce((a, r) => a + r.totalPresent, 0);
      const totN   = rpt.rows.reduce((a, r) => a + r.totalAbsent, 0);
      const totL   = rpt.rows.reduce((a, r) => a + r.totalLate, 0);
      const totAll = totP + totN;
      const effPct = totAll > 0 ? Math.round((totP / totAll) * 100) : 0;
      const latePct = totAll > 0 ? Math.round((totL / totAll) * 100) : 0;
      const totalWorkers = users.filter(u => u.role === 'safaikarmi').length;
      const totalComplaints = complaints.length;
      const genBy = 'Superadmin'; // always super-admin context here
      const genDate = new Date(rpt.generatedAt).toLocaleString('en-IN', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
      });

      // ── Date-range filter ──────────────────────────────────────────
      const inRangePDF = (dateStr: string) => {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return false;
        const y = d.getFullYear(), m = d.getMonth() + 1;
        if (y !== rpt.year) return false;
        if (rpt.type === 'monthly') return m === rpt.month;
        if (rpt.type === 'quarterly' && rpt.quarter) { const qs = (rpt.quarter-1)*3+1; return m>=qs && m<=qs+2; }
        return true;
      };

      // ── Ward map ───────────────────────────────────────────────────
      const wardMap: Record<number, {p:number;n:number;l:number;houses:number}> = {};
      for (const row of rpt.rows) {
        const wn = row.wardNo ?? 0;
        if (!wardMap[wn]) wardMap[wn] = { p:0, n:0, l:0, houses:0 };
        wardMap[wn].p += row.totalPresent;
        wardMap[wn].n += row.totalAbsent;
        wardMap[wn].l += row.totalLate;
        wardMap[wn].houses++;
      }

      // ── Worker map ─────────────────────────────────────────────────
      const workerMap: Record<string, {p:number;n:number;assigned:number}> = {};
      const filteredVisits = houseVisits.filter(v => inRangePDF(v.visitDate));
      for (const v of filteredVisits) {
        if (!v.workerId) continue;
        if (!workerMap[v.workerId]) workerMap[v.workerId] = { p:0, n:0, assigned:0 };
        if (v.collectedGarbage) workerMap[v.workerId].p++;
        else workerMap[v.workerId].n++;
      }
      for (const wid of Object.keys(workerMap)) workerMap[wid].assigned = workerMap[wid].p + workerMap[wid].n;

      // ── Trend data ─────────────────────────────────────────────────
      const trendData: { label:string; pct:number }[] = [];
      if (rpt.type === 'monthly' && rpt.dayHeaders) {
        for (const day of rpt.dayHeaders) {
          let p = 0;
          for (const row of rpt.rows) { const st = row.dailyStatus[day] ?? 'N'; if (st==='P'||st==='L') p++; }
          trendData.push({ label: String(day), pct: rpt.rows.length > 0 ? Math.round((p/rpt.rows.length)*100) : 0 });
        }
      } else if (rpt.type === 'quarterly' && rpt.weekHeaders) {
        for (const wh of rpt.weekHeaders) {
          let p = 0, tot = 0;
          for (const row of rpt.rows) { p += row.weeklyCollected?.[wh.key] ?? 0; tot += wh.totalDays; }
          trendData.push({ label: wh.label.replace('Week ','W'), pct: tot>0 ? Math.round((p/tot)*100) : 0 });
        }
      } else {
        for (let mi = 1; mi <= 12; mi++) {
          let p = 0, tot = 0;
          for (const row of rpt.rows) { const md = row.monthlyData?.[mi]; if (md) { p+=md.p; tot+=daysInMonth(mi,rpt.year); } }
          trendData.push({ label: MONTH_NAMES[mi-1].slice(0,3), pct: tot>0 ? Math.round((p/tot)*100) : 0 });
        }
      }

      // ── House collection table (existing design) ───────────────────
      let colHeaders = '';
      let dataRows = '';
      if (rpt.type === 'monthly') {
        const dh = rpt.dayHeaders;
        colHeaders = `<th>#</th><th>Reg No</th><th>Ward</th>${dh.map(d=>`<th>${d}</th>`).join('')}<th>P</th><th>N</th><th>L</th><th>%</th><th>Status</th>`;
        dataRows = rpt.rows.map(row => {
          const cells = dh.map(d => {
            const st = row.dailyStatus[d] ?? 'N';
            const bg = st==='P' ? '#dcfce7' : st==='L' ? '#fef9c3' : '#fee2e2';
            const cl = st==='P' ? '#16a34a' : st==='L' ? '#b45309' : '#dc2626';
            return `<td style="background:${bg};color:${cl};font-weight:700;padding:2px 3px">${st}</td>`;
          }).join('');
          const pct = parseInt(row.percentage);
          const sClr = pct>=80?'#16a34a':pct>=50?'#d97706':'#dc2626';
          const sLbl = pct>=80?'🟢 Good':pct>=50?'🟡 Average':'🔴 Poor';
          return `<tr><td>${row.sNo}</td><td style="font-weight:600">${row.houseRegNo}</td><td>${row.wardNo}</td>${cells}<td style="color:#16a34a;font-weight:700">${row.totalPresent}</td><td style="color:#dc2626;font-weight:700">${row.totalAbsent}</td><td style="color:#d97706;font-weight:700">${row.totalLate}</td><td style="color:#6366f1;font-weight:700">${row.percentage}</td><td style="color:${sClr};font-weight:600;white-space:nowrap">${sLbl}</td></tr>`;
        }).join('');
      } else if (rpt.type === 'quarterly') {
        const wh = rpt.weekHeaders ?? [];
        colHeaders = `<th>#</th><th>Reg No</th><th>Ward</th>${wh.map(h=>`<th>${h.label.replace('Week','W')}</th>`).join('')}<th>P</th><th>N</th><th>L</th><th>%</th><th>Status</th>`;
        dataRows = rpt.rows.map(row => {
          const cells = wh.map(h => { const col=row.weeklyCollected?.[h.key]??0; const r2=h.totalDays>0?col/h.totalDays:0; const cl=r2>=0.8?'#16a34a':r2>=0.5?'#d97706':'#dc2626'; return `<td style="color:${cl};font-weight:700">${col}/${h.totalDays}</td>`; }).join('');
          const pct=parseInt(row.percentage); const sClr=pct>=80?'#16a34a':pct>=50?'#d97706':'#dc2626'; const sLbl=pct>=80?'🟢 Good':pct>=50?'🟡 Average':'🔴 Poor';
          return `<tr><td>${row.sNo}</td><td style="font-weight:600">${row.houseRegNo}</td><td>${row.wardNo}</td>${cells}<td style="color:#16a34a;font-weight:700">${row.totalPresent}</td><td style="color:#dc2626;font-weight:700">${row.totalAbsent}</td><td style="color:#d97706;font-weight:700">${row.totalLate}</td><td style="color:#6366f1;font-weight:700">${row.percentage}</td><td style="color:${sClr};font-weight:600;white-space:nowrap">${sLbl}</td></tr>`;
        }).join('');
      } else {
        colHeaders = `<th>#</th><th>Reg No</th><th>Ward</th>${MONTH_NAMES.map(m=>`<th>${m.slice(0,3)}</th>`).join('')}<th>P</th><th>N</th><th>L</th><th>%</th><th>Status</th>`;
        dataRows = rpt.rows.map(row => {
          const cells = Array.from({length:12},(_,i)=>{ const p=row.monthlyData?.[i+1]?.p??0; const tot=daysInMonth(i+1,rpt.year); const r2=tot>0?p/tot:0; const cl=r2>=0.8?'#16a34a':r2>=0.5?'#d97706':'#dc2626'; return `<td style="color:${cl};font-weight:700">${p}</td>`; }).join('');
          const pct=parseInt(row.percentage); const sClr=pct>=80?'#16a34a':pct>=50?'#d97706':'#dc2626'; const sLbl=pct>=80?'🟢 Good':pct>=50?'🟡 Average':'🔴 Poor';
          return `<tr><td>${row.sNo}</td><td style="font-weight:600">${row.houseRegNo}</td><td>${row.wardNo}</td>${cells}<td style="color:#16a34a;font-weight:700">${row.totalPresent}</td><td style="color:#dc2626;font-weight:700">${row.totalAbsent}</td><td style="color:#d97706;font-weight:700">${row.totalLate}</td><td style="color:#6366f1;font-weight:700">${row.percentage}</td><td style="color:${sClr};font-weight:600;white-space:nowrap">${sLbl}</td></tr>`;
        }).join('');
      }

      // ── Helper HTML builders ───────────────────────────────────────
      function bar(pct: number, clr: string, h = 10) {
        return `<div style="background:#e2e8f0;border-radius:3px;height:${h}px;width:100%;overflow:hidden"><div style="background:${clr};width:${pct}%;height:${h}px;border-radius:3px"></div></div>`;
      }
      function effColor(p: number) { return p>=80?'#16a34a':p>=50?'#d97706':'#dc2626'; }
      function effEmoji(p: number) { return p>=80?'🟢':p>=50?'🟡':'🔴'; }

      // ── Ward chart bars ────────────────────────────────────────────
      const wardChartHTML = Object.entries(wardMap).sort(([a],[b])=>Number(a)-Number(b)).map(([wn,d])=>{
        const tot=d.p+d.n; const eff=tot>0?Math.round((d.p/tot)*100):0; const cl=effColor(eff);
        return `<div style="display:flex;align-items:center;gap:5px;margin-bottom:5px">
          <span style="font-size:7px;color:#475569;min-width:28px">W${wn}</span>
          ${bar(eff,cl,9)}
          <span style="font-size:7px;font-weight:700;color:${cl};min-width:26px;text-align:right">${eff}%</span>
        </div>`;
      }).join('') || '<div style="font-size:8px;color:#94a3b8;text-align:center;padding:16px">No ward data</div>';

      // ── Trend sparkline bars ───────────────────────────────────────
      const trendHTML = trendData.length > 0
        ? `<div style="display:flex;align-items:flex-end;gap:2px;height:55px;padding-top:4px">
            ${trendData.map(t=>{ const h=Math.max(2,Math.round((t.pct/100)*48)); const cl=effColor(t.pct); return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:1px"><div style="width:100%;background:${cl};height:${h}px;border-radius:2px 2px 0 0"></div><span style="font-size:4.5px;color:#64748b">${t.label}</span></div>`; }).join('')}
           </div>`
        : '<div style="font-size:8px;color:#94a3b8;text-align:center;padding:16px">No trend data</div>';

      // ── Collection status stacked bar ──────────────────────────────
      const missPct2 = Math.max(0, 100 - effPct - latePct);
      const statusHTML = `
        <div style="height:18px;border-radius:6px;overflow:hidden;display:flex;margin:6px 0">
          <div style="width:${effPct}%;background:linear-gradient(90deg,#16a34a,#22c55e)"></div>
          <div style="width:${latePct}%;background:linear-gradient(90deg,#d97706,#f59e0b)"></div>
          <div style="flex:1;background:linear-gradient(90deg,#dc2626,#ef4444)"></div>
        </div>
        <div style="display:flex;flex-direction:column;gap:3px">
          <div style="display:flex;justify-content:space-between;font-size:7.5px"><span>🟢 Collected</span><strong style="color:#16a34a">${totP} · ${effPct}%</strong></div>
          <div style="display:flex;justify-content:space-between;font-size:7.5px"><span>🟡 Late</span><strong style="color:#d97706">${totL} · ${latePct}%</strong></div>
          <div style="display:flex;justify-content:space-between;font-size:7.5px"><span>🔴 Missed</span><strong style="color:#dc2626">${totN} · ${missPct2}%</strong></div>
        </div>`;

      // ── Worker performance chart bars ──────────────────────────────
      const workerChartHTML = Object.entries(workerMap).slice(0,6).map(([wid,d])=>{
        const worker = users.find(u=>u.id===wid);
        const eff = d.assigned>0 ? Math.round((d.p/d.assigned)*100) : 0;
        const cl = effColor(eff);
        const nm = (worker?.name ?? wid).split(' ')[0];
        return `<div style="display:flex;align-items:center;gap:5px;margin-bottom:5px">
          <span style="font-size:6.5px;color:#475569;min-width:36px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${nm}</span>
          ${bar(eff,cl,9)}
          <span style="font-size:7px;font-weight:700;color:${cl};min-width:26px;text-align:right">${eff}%</span>
        </div>`;
      }).join('') || '<div style="font-size:8px;color:#94a3b8;text-align:center;padding:16px">No worker data</div>';

      // ── Ward table rows ────────────────────────────────────────────
      const wardTableRows = Object.entries(wardMap).sort(([a],[b])=>Number(a)-Number(b)).map(([wn,d])=>{
        const tot=d.p+d.n; const eff=tot>0?Math.round((d.p/tot)*100):0; const cl=effColor(eff);
        return `<tr>
          <td>Ward ${wn}</td><td>${d.houses}</td>
          <td style="color:#16a34a;font-weight:700">${d.p}</td>
          <td style="color:#dc2626;font-weight:700">${d.n}</td>
          <td><div style="display:flex;align-items:center;gap:4px">${bar(eff,cl,10)}<span style="color:${cl};font-weight:700;white-space:nowrap">${eff}% ${effEmoji(eff)}</span></div></td>
        </tr>`;
      }).join('');

      // ── Worker table rows ──────────────────────────────────────────
      const workerTableRows = Object.entries(workerMap).map(([wid,d])=>{
        const worker = users.find(u=>u.id===wid);
        const eff = d.assigned>0 ? Math.round((d.p/d.assigned)*100) : 0; const cl=effColor(eff);
        return `<tr>
          <td style="text-align:left;font-weight:600">${worker?.name ?? wid}</td>
          <td>${d.assigned}</td>
          <td style="color:#16a34a;font-weight:700">${d.p}</td>
          <td style="color:#dc2626;font-weight:700">${d.n}</td>
          <td><div style="display:flex;align-items:center;gap:4px">${bar(eff,cl,10)}<span style="color:${cl};font-weight:700;white-space:nowrap">${eff}% ${effEmoji(eff)}</span></div></td>
        </tr>`;
      }).join('');

      // ── Full HTML ─────────────────────────────────────────────────
      const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<style>
  @page{size:A4;margin:10mm}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,Helvetica,sans-serif;background:#fff;color:#0f172a;font-size:9px;line-height:1.4}

  /* ── Header ── */
  .hdr{border:2px solid #1e3a8a;border-radius:8px;padding:10px 16px;margin-bottom:8px;text-align:center;background:linear-gradient(135deg,#eff6ff,#dbeafe)}
  .hdr-logo{font-size:20px;font-weight:900;color:#1e3a8a;letter-spacing:3px}
  .hdr-sub{font-size:10px;font-weight:700;color:#1e40af;margin-top:1px}
  .hdr-tag{font-size:7.5px;color:#64748b;margin-top:2px}

  /* ── Info box ── */
  .info{border:1px solid #bfdbfe;border-radius:5px;padding:7px 12px;margin-bottom:8px;background:#f0f9ff;display:grid;grid-template-columns:1fr 1fr;gap:2px 20px}
  .ir{font-size:8px;display:flex;gap:4px}
  .ik{color:#1d4ed8;font-weight:700;min-width:110px}
  .iv{color:#0f172a}

  /* ── Stat cards ── */
  .cards{display:flex;gap:6px;margin-bottom:6px}
  .card{flex:1;border-radius:7px;padding:7px 8px;text-align:center;border:1px solid transparent}
  .cv{font-size:15px;font-weight:900;line-height:1}
  .cl{font-size:6.5px;text-transform:uppercase;font-weight:700;color:#475569;letter-spacing:0.4px;margin-top:3px}
  .ci{font-size:11px;margin-bottom:2px}

  /* ── Chart grid ── */
  .cgrid{display:flex;gap:6px;margin-bottom:8px}
  .cbox{flex:1;border:1px solid #e2e8f0;border-radius:6px;padding:7px}
  .ct{font-size:7.5px;font-weight:700;color:#1e3a8a;border-bottom:1px solid #f1f5f9;padding-bottom:3px;margin-bottom:5px;text-transform:uppercase;letter-spacing:0.4px}

  /* ── Section headers ── */
  .sh{background:linear-gradient(90deg,#1e3a8a,#1e40af);color:#fff;padding:5px 10px;font-size:9px;font-weight:700;border-radius:4px 4px 0 0;margin-top:8px;display:flex;align-items:center;gap:4px}
  table{border-collapse:collapse;width:100%}
  th{background:#dbeafe;color:#1e3a8a;padding:4px 6px;text-align:center;font-size:8px;font-weight:700;border:1px solid #bfdbfe}
  td{padding:3px 5px;text-align:center;font-size:7.5px;border:1px solid #e2e8f0}
  tr:nth-child(even) td{background:#f8fafc}
  td:first-child,th:first-child{text-align:left}

  /* ── House data table (smaller for compactness) ── */
  table.dt th{font-size:7px;padding:3px 4px}
  table.dt td{padding:2px 3px;font-size:7px}

  /* ── Footer ── */
  .ftr{margin-top:10px;padding-top:5px;border-top:2px solid #dbeafe;display:flex;justify-content:space-between;align-items:center}
  .ftr-l{font-size:7px;color:#475569}
  .ftr-r{font-size:7px;color:#1e3a8a;font-weight:700}
</style>
</head><body>

<!-- ══ HEADER ══ -->
<div class="hdr">
  <div class="hdr-logo">🏛 DNP360</div>
  <div class="hdr-sub">NAGAR PARISHAD, DAUDNAGAR</div>
  <div class="hdr-tag">Garbage Collection Management System · Bihar, India</div>
</div>

<!-- ══ REPORT INFO BOX ══ -->
<div class="info">
  <div class="ir"><span class="ik">REPORT TYPE</span><span class="iv">: ${rpt.type.toUpperCase()} — ${rpt.label}</span></div>
  <div class="ir"><span class="ik">TOTAL HOUSES COVERED</span><span class="iv">: ${rpt.rows.length.toLocaleString()}</span></div>
  <div class="ir"><span class="ik">GENERATED ON</span><span class="iv">: ${genDate}</span></div>
  <div class="ir"><span class="ik">TOTAL WORKERS</span><span class="iv">: ${totalWorkers}</span></div>
  <div class="ir"><span class="ik">GENERATED BY</span><span class="iv">: ${genBy}</span></div>
  <div class="ir"><span class="ik">TOTAL COMPLAINTS</span><span class="iv">: ${totalComplaints}</span></div>
</div>

<!-- ══ STAT CARDS ROW 1 (4 cards) ══ -->
<div class="cards">
  <div class="card" style="background:linear-gradient(135deg,#eff6ff,#dbeafe);border-color:#bfdbfe">
    <div class="ci">🏠</div><div class="cv" style="color:#1e40af">${rpt.rows.length.toLocaleString()}</div><div class="cl">Total Houses</div>
  </div>
  <div class="card" style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-color:#bbf7d0">
    <div class="ci">🟢</div><div class="cv" style="color:#16a34a">${totP.toLocaleString()}</div><div class="cl">Collected</div>
  </div>
  <div class="card" style="background:linear-gradient(135deg,#fef2f2,#fee2e2);border-color:#fecaca">
    <div class="ci">🔴</div><div class="cv" style="color:#dc2626">${totN.toLocaleString()}</div><div class="cl">Missed</div>
  </div>
  <div class="card" style="background:linear-gradient(135deg,#fffbeb,#fef9c3);border-color:#fde68a">
    <div class="ci">🟡</div><div class="cv" style="color:#d97706">${totL.toLocaleString()}</div><div class="cl">Late</div>
  </div>
</div>

<!-- ══ STAT CARDS ROW 2 (3 cards) ══ -->
<div class="cards" style="margin-bottom:8px">
  <div class="card" style="background:linear-gradient(135deg,#eef2ff,#e0e7ff);border-color:#c7d2fe">
    <div class="ci">🔵</div><div class="cv" style="color:#4f46e5">${effPct}%</div><div class="cl">Efficiency</div>
  </div>
  <div class="card" style="background:linear-gradient(135deg,#f5f3ff,#ede9fe);border-color:#ddd6fe">
    <div class="ci">🟣</div><div class="cv" style="color:#7c3aed">${totalWorkers}</div><div class="cl">Workers</div>
  </div>
  <div class="card" style="background:linear-gradient(135deg,#fff7ed,#ffedd5);border-color:#fed7aa">
    <div class="ci">🟠</div><div class="cv" style="color:#ea580c">${totalComplaints}</div><div class="cl">Complaints</div>
  </div>
</div>

<!-- ══ CHARTS 2×2 ══ -->
<div class="cgrid">
  <div class="cbox">
    <div class="ct">📊 Ward Collection</div>
    ${wardChartHTML}
  </div>
  <div class="cbox">
    <div class="ct">📈 Daily Trend</div>
    ${trendHTML}
  </div>
</div>
<div class="cgrid">
  <div class="cbox">
    <div class="ct">🥧 Collection Status</div>
    ${statusHTML}
  </div>
  <div class="cbox">
    <div class="ct">👷 Worker Performance</div>
    ${workerChartHTML}
  </div>
</div>

<!-- ══ WARD PERFORMANCE TABLE ══ -->
<div class="sh">🗺️ WARD PERFORMANCE &nbsp;<span style="font-size:7px;opacity:0.8">(${rpt.wardId ? 'Selected Ward' : 'All Wards'})</span></div>
<table>
  <thead><tr><th>Ward</th><th>Houses</th><th>Collected</th><th>Missed</th><th style="min-width:120px">Efficiency</th></tr></thead>
  <tbody>${wardTableRows || '<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:8px">No ward data available</td></tr>'}</tbody>
</table>

<!-- ══ WORKER PERFORMANCE TABLE ══ -->
<div class="sh">👷 WORKER PERFORMANCE &nbsp;<span style="font-size:7px;opacity:0.8">(All)</span></div>
<table>
  <thead><tr><th>Worker</th><th>Assigned</th><th>Collected</th><th>Missed</th><th style="min-width:120px">Efficiency</th></tr></thead>
  <tbody>${workerTableRows || '<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:8px">No worker visit data for this period</td></tr>'}</tbody>
</table>

<!-- ══ HOUSE COLLECTION DETAILS ══ -->
<div class="sh">🏠 HOUSE COLLECTION DETAILS</div>
<div style="font-size:7.5px;color:#475569;padding:4px 0;display:flex;gap:12px">
  <span>🟢 P = Collected on time</span>
  <span>🔴 N = Not collected</span>
  <span>🟡 L = Collected late</span>
</div>
<table class="dt">
  <thead><tr>${colHeaders}</tr></thead>
  <tbody>${dataRows || '<tr><td colspan="20" style="text-align:center;color:#94a3b8;padding:8px">No house data</td></tr>'}</tbody>
</table>

<!-- ══ FOOTER ══ -->
<div class="ftr">
  <div class="ftr-l">
    Generated by DNP360 System · Nagar Parishad, Daudnagar<br>
    &copy; DNP360&reg; · &copy; SUPERADMIN · ${new Date().toLocaleDateString('en-IN')}
  </div>
  <div class="ftr-r">DNP360 · Nagar Parishad Daudnagar</div>
</div>

</body></html>`;

      if (Platform.OS === 'web') {
        const w = (window as any).open('', '_blank');
        if (w) { w.document.write(html); w.document.close(); w.focus(); w.print(); }
        else showAlert('Popup Blocked', 'Please allow popups to export PDF.', undefined, 'info');
      } else {
        await Print.printAsync({ html });
      }
    } catch (e: any) { showAlert('PDF Failed', e?.message ?? 'Unknown error', undefined, 'error'); }
    finally { setExportingPDF(false); }
  }

  const yearOptions = useMemo(() => {
    const y = now.getFullYear();
    return [y - 2, y - 1, y, y + 1];
  }, []);

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Report type tabs + History button */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabRow}>
        {REPORT_TABS.map(t => {
          const active = tab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={[s.tabPill, active && { backgroundColor: t.color + '18', borderColor: t.color + '40' }]}
              onPress={() => { setTab(t.key); setReport(null); }}
              activeOpacity={0.7}
            >
              <Feather name={t.icon as any} size={14} color={active ? t.color : MUTED} />
              <Text style={[s.tabLabel, { color: active ? t.color : MUTED, fontFamily: active ? 'Inter_700Bold' : 'Inter_500Medium' }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
        {/* History pill */}
        <TouchableOpacity
          style={[s.tabPill, { borderColor: '#F59E0B40', backgroundColor: '#F59E0B10', minWidth: 100 }]}
          onPress={() => setShowHistory(true)}
          activeOpacity={0.7}
        >
          <Feather name="clock" size={14} color="#F59E0B" />
          <Text style={[s.tabLabel, { color: '#F59E0B', fontFamily: 'Inter_700Bold' }]}>History</Text>
          {historyMeta.length > 0 && (
            <View style={{ backgroundColor: '#F59E0B', borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 }}>
              <Text style={{ color: '#000', fontSize: 9, fontFamily: 'Inter_700Bold' }}>{historyMeta.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* ── Auto-generate countdown bar ──────────────────────────────── */}
      {countdown !== '' && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.07)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.15)' }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' }} />
          <Text style={{ color: '#FCA5A5', fontSize: 11, fontFamily: 'Inter_500Medium', flex: 1 }} numberOfLines={1}>
            Auto-report: {countdown}
          </Text>
        </View>
      )}

      {/* Config panel */}
      <View style={s.configCard}>
        <LinearGradient colors={['rgba(99,102,241,0.12)','rgba(79,70,229,0.06)']} style={StyleSheet.absoluteFill as any} />

        {/* Year selector */}
        <Text style={s.cfgLabel}>Year</Text>
        <View style={s.pillRow}>
          {yearOptions.map(y => (
            <TouchableOpacity
              key={y}
              style={[s.optPill, selYear === y && { backgroundColor: '#6366F120', borderColor: '#6366F155' }]}
              onPress={() => { setSelYear(y); setReport(null); }}
            >
              <Text style={[s.optPillTxt, selYear === y && { color: '#818CF8' }]}>{y}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Month selector (monthly only) */}
        {tab === 'monthly' && (
          <>
            <Text style={[s.cfgLabel, { marginTop: 9 }]}>Month</Text>
            <View style={s.pillGrid}>
              {MONTH_NAMES.map((m, i) => {
                const active = selMonth === i + 1;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[s.monthPill, active && { backgroundColor: '#22D3EE18', borderColor: '#22D3EE50' }]}
                    onPress={() => { setSelMonth(i + 1); setReport(null); }}
                  >
                    <Text style={[s.monthPillTxt, active && { color: '#22D3EE' }]}>{m.slice(0, 3)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* Quarter selector (quarterly only) */}
        {tab === 'quarterly' && (
          <>
            <Text style={[s.cfgLabel, { marginTop: 9 }]}>Quarter</Text>
            <View style={s.pillRow}>
              {[1, 2, 3, 4].map(q => (
                <TouchableOpacity
                  key={q}
                  style={[s.optPill, selQuarter === q && { backgroundColor: '#A78BFA20', borderColor: '#A78BFA55' }]}
                  onPress={() => { setSelQuarter(q); setReport(null); }}
                >
                  <Text style={[s.optPillTxt, selQuarter === q && { color: '#A78BFA' }]}>Q{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Ward selector */}
        <Text style={[s.cfgLabel, { marginTop: 9 }]}>Ward</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 5, paddingBottom: 2 }}>
          <TouchableOpacity
            style={[s.wardPill, selWardId === null && { backgroundColor: '#6366F120', borderColor: '#6366F155' }]}
            onPress={() => { setSelWardId(null); setReport(null); }}
          >
            <Text style={[s.wardPillTxt, selWardId === null && { color: '#818CF8' }]}>All Wards</Text>
          </TouchableOpacity>
          {wards.map(w => (
            <TouchableOpacity
              key={w.id}
              style={[s.wardPill, selWardId === w.id && { backgroundColor: '#6366F120', borderColor: '#6366F155' }]}
              onPress={() => { setSelWardId(w.id); setReport(null); }}
            >
              <Text style={[s.wardPillTxt, selWardId === w.id && { color: '#818CF8' }]}>Ward {w.wardNumber}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Generate button */}
        <TouchableOpacity
          onPress={() => handleGenerate(false)}
          disabled={generating}
          activeOpacity={0.85}
          style={{ marginTop: 10 }}
        >
          <LinearGradient
            colors={tab === 'monthly' ? ['#0EA5E9','#0284C7'] : tab === 'quarterly' ? ['#7C3AED','#4F46E5'] : ['#10B981','#059669']}
            style={s.genBtn}
          >
            {generating
              ? <ActivityIndicator size={16} color="#fff" />
              : <>
                  <Feather name="zap" size={15} color="#fff" />
                  <Text style={s.genBtnTxt}>Generate Report</Text>
                </>
            }
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ── History Modal ───────────────────────────────────────────── */}
      <Modal visible={showHistory} transparent animationType="slide" onRequestClose={() => { setShowHistory(false); setSelIds(new Set()); }}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} onPress={() => { setShowHistory(false); setSelIds(new Set()); }} />
        <View style={s.histModal}>
          {/* Modal header */}
          <View style={s.histHeader}>
            <Feather name="clock" size={16} color="#F59E0B" />
            <Text style={s.histHeaderTxt}>
              {selIds.size > 0 ? `${selIds.size} selected` : 'Report History'}
            </Text>
            {historyLoading && <ActivityIndicator size={12} color={MUTED} style={{ marginLeft: 4 }} />}
            <View style={{ flex: 1 }} />
            {/* Select-all / deselect */}
            {historyMeta.length > 0 && (
              <TouchableOpacity
                onPress={() => setSelIds(selIds.size === historyMeta.length ? new Set() : new Set(historyMeta.map(h => h.id)))}
                style={{ padding: 6 }}
              >
                <Feather name={selIds.size === historyMeta.length ? 'check-square' : 'square'} size={16} color="#F59E0B" />
              </TouchableOpacity>
            )}
            {/* Delete selected */}
            {selIds.size > 0 && (
              <TouchableOpacity
                onPress={() => showAlert('Delete Reports', `Delete ${selIds.size} report${selIds.size > 1 ? 's' : ''}? This cannot be undone.`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => deleteSelected([...selIds]) },
                ], 'warning')}
                style={{ padding: 6, marginLeft: 4 }}
                disabled={deleting}
              >
                {deleting ? <ActivityIndicator size={16} color="#FB7185" /> : <Feather name="trash-2" size={16} color="#FB7185" />}
              </TouchableOpacity>
            )}
            {/* Delete all */}
            {selIds.size === 0 && historyMeta.length > 0 && (
              <TouchableOpacity
                onPress={() => showAlert('Clear All History', `Delete all ${historyMeta.length} history records? This cannot be undone.`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete All', style: 'destructive', onPress: () => deleteSelected(historyMeta.map(h => h.id)) },
                ], 'warning')}
                style={{ padding: 6, marginLeft: 4 }}
              >
                <Feather name="trash" size={15} color={MUTED} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => { setShowHistory(false); setSelIds(new Set()); }} style={{ padding: 4, marginLeft: 4 }}>
              <Feather name="x" size={18} color={MUTED} />
            </TouchableOpacity>
          </View>

          {/* Long-press hint */}
          {selIds.size === 0 && historyMeta.length > 0 && (
            <View style={{ paddingHorizontal: 14, paddingVertical: 6, backgroundColor: 'rgba(245,158,11,0.06)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' }}>
              <Text style={{ color: MUTED, fontSize: 10, fontFamily: 'Inter_400Regular' }}>Long-press any report to select for deletion</Text>
            </View>
          )}

          {/* Category filter tabs */}
          <View style={s.histFilterRow}>
            {(['all', 'auto', 'manual'] as const).map(f => (
              <TouchableOpacity
                key={f}
                style={[s.histFilterPill, historyFilter === f && { backgroundColor: '#F59E0B20', borderColor: '#F59E0B55' }]}
                onPress={() => setHistoryFilter(f)}
              >
                <Feather name={f === 'auto' ? 'zap' : f === 'manual' ? 'user' : 'list'} size={11} color={historyFilter === f ? '#F59E0B' : MUTED} />
                <Text style={[s.histFilterTxt, historyFilter === f && { color: '#F59E0B' }]}>
                  {f === 'all' ? 'All' : f === 'auto' ? 'Auto' : 'Manual'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 14 }} showsVerticalScrollIndicator={false}>
            {/* Auto-Generated section */}
            {(historyFilter === 'all' || historyFilter === 'auto') && (() => {
              const list = historyMeta.filter(r => r.generatedBy === 'auto');
              if (list.length === 0 && historyFilter === 'auto') return <View style={s.histEmpty}><Feather name="zap" size={20} color={MUTED} /><Text style={s.histEmptyTxt}>No auto-generated reports yet</Text></View>;
              if (list.length === 0) return null;
              return (
                <View style={{ marginBottom: 16 }}>
                  <View style={s.histCatHeader}>
                    <Feather name="zap" size={12} color="#22D3EE" />
                    <Text style={[s.histCatLabel, { color: '#22D3EE' }]}>Auto-Generated</Text>
                    <View style={[s.histCatBadge, { backgroundColor: '#22D3EE20' }]}><Text style={[s.histCatBadgeTxt, { color: '#22D3EE' }]}>{list.length}</Text></View>
                  </View>
                  {list.map((r, i) => { const mem = reportHistory.find(h => h.id === r.id); return <HistoryCard key={r.id} r={r} isActive={report?.id === r.id} inMemory={!!mem} selected={selIds.has(r.id)} onPress={() => { if (selIds.size > 0) { toggleSel(r.id); return; } if (mem) { setReport(mem); setShowHistory(false); setSelIds(new Set()); } else { showAlert('Reload Required', 'Please regenerate this report.', undefined, 'info'); } }} onLongPress={() => toggleSel(r.id)} onExportPDF={mem ? () => handleExportPDF(mem) : undefined} last={i === list.length - 1} />; })}
                </View>
              );
            })()}

            {/* Manually Generated section */}
            {(historyFilter === 'all' || historyFilter === 'manual') && (() => {
              const manualList = historyMeta.filter(r => r.generatedBy === 'manual' || !(r as any).generatedBy);
              if (manualList.length === 0 && historyFilter === 'manual') return <View style={s.histEmpty}><Feather name="user" size={20} color={MUTED} /><Text style={s.histEmptyTxt}>No manual reports yet</Text></View>;
              if (manualList.length === 0) return null;
              return (
                <View style={{ marginBottom: 16 }}>
                  <View style={s.histCatHeader}>
                    <Feather name="user" size={12} color="#A78BFA" />
                    <Text style={[s.histCatLabel, { color: '#A78BFA' }]}>Manually Generated</Text>
                    <View style={[s.histCatBadge, { backgroundColor: '#A78BFA20' }]}><Text style={[s.histCatBadgeTxt, { color: '#A78BFA' }]}>{manualList.length}</Text></View>
                  </View>
                  {manualList.map((r, i) => { const mem = reportHistory.find(h => h.id === r.id); return <HistoryCard key={r.id} r={r} isActive={report?.id === r.id} inMemory={!!mem} selected={selIds.has(r.id)} onPress={() => { if (selIds.size > 0) { toggleSel(r.id); return; } if (mem) { setReport(mem); setShowHistory(false); setSelIds(new Set()); } else { showAlert('Reload Required', 'Please regenerate this report.', undefined, 'info'); } }} onLongPress={() => toggleSel(r.id)} onExportPDF={mem ? () => handleExportPDF(mem) : undefined} last={i === manualList.length - 1} />; })}
                </View>
              );
            })()}

            {historyMeta.length === 0 && !historyLoading && (
              <View style={s.histEmpty}>
                <Feather name="file-text" size={28} color={MUTED} />
                <Text style={s.histEmptyTxt}>No reports generated yet</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* ── Share Menu Modal ─────────────────────────────────────────── */}
      <Modal visible={showShareMenu} transparent animationType="fade" onRequestClose={() => setShowShareMenu(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }} onPress={() => setShowShareMenu(false)}>
          <Pressable onPress={e => e.stopPropagation()}>
            <View style={{ backgroundColor: '#0D1226', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32, borderTopWidth: 1, borderTopColor: 'rgba(99,102,241,0.25)' }}>
              <Text style={{ color: TEXT, fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 16 }}>Share Report</Text>
              {/* Normal share */}
              <TouchableOpacity
                onPress={() => report && handleNormalShare(report)}
                activeOpacity={0.8}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(99,102,241,0.10)', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(99,102,241,0.25)' }}
              >
                <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#6366F118', justifyContent: 'center', alignItems: 'center' }}>
                  <Feather name="share-2" size={18} color="#818CF8" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: TEXT, fontSize: 13, fontFamily: 'Inter_700Bold' }}>Normal Share</Text>
                  <Text style={{ color: MUTED, fontSize: 10, fontFamily: 'Inter_400Regular', marginTop: 2 }}>Share via WhatsApp, SMS, email & more</Text>
                </View>
                <Feather name="chevron-right" size={14} color={MUTED} />
              </TouchableOpacity>
              {/* Auto-recipients share */}
              <TouchableOpacity
                onPress={() => { setShowShareMenu(false); setShowRecipientsModal(true); }}
                activeOpacity={0.8}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(245,158,11,0.10)', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)' }}
              >
                <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#F59E0B18', justifyContent: 'center', alignItems: 'center' }}>
                  <Feather name="zap" size={18} color="#F59E0B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: TEXT, fontSize: 13, fontFamily: 'Inter_700Bold' }}>Auto-Send Recipients</Text>
                  <Text style={{ color: MUTED, fontSize: 10, fontFamily: 'Inter_400Regular', marginTop: 2 }}>
                    {reportRecipients.length > 0
                      ? `${reportRecipients.length} official${reportRecipients.length !== 1 ? 's' : ''} set — receive every auto-report`
                      : 'Pick officials who receive auto-generated reports'}
                  </Text>
                </View>
                <Feather name="chevron-right" size={14} color={MUTED} />
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Recipients Picker Modal ──────────────────────────────────── */}
      <Modal
        visible={showRecipientsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRecipientsModal(false)}
        onShow={() => setRecipientDraft(reportRecipients)}
      >
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} onPress={() => setShowRecipientsModal(false)} />
        <View style={{ backgroundColor: '#0D1226', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%', borderTopWidth: 1, borderTopColor: 'rgba(245,158,11,0.25)' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' }}>
            <Feather name="zap" size={15} color="#F59E0B" />
            <Text style={{ color: TEXT, fontSize: 15, fontFamily: 'Inter_700Bold', flex: 1 }}>Auto-Send Recipients</Text>
            <TouchableOpacity onPress={() => setShowRecipientsModal(false)}><Feather name="x" size={18} color={MUTED} /></TouchableOpacity>
          </View>
          <View style={{ paddingHorizontal: 14, paddingVertical: 10, backgroundColor: 'rgba(245,158,11,0.06)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' }}>
            <Text style={{ color: MUTED, fontSize: 10, fontFamily: 'Inter_400Regular' }}>
              Selected officials receive every auto-generated report. Add once — it works automatically every month.
            </Text>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 14, gap: 8 }}>
            {users.filter(u => u.role === 'official' || u.role === 'admin').length === 0 && (
              <View style={{ alignItems: 'center', padding: 24, gap: 8 }}>
                <Feather name="users" size={28} color={MUTED} />
                <Text style={{ color: MUTED, fontSize: 12 }}>No officials found</Text>
              </View>
            )}
            {users.filter(u => u.role === 'official' || u.role === 'admin').map(u => {
              const sel = recipientDraft.includes(u.id);
              const roleClr = u.role === 'admin' ? '#A78BFA' : '#FCD34D';
              return (
                <TouchableOpacity
                  key={u.id}
                  onPress={() => setRecipientDraft(prev => prev.includes(u.id) ? prev.filter(x => x !== u.id) : [...prev, u.id])}
                  activeOpacity={0.8}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, marginBottom: 8, borderRadius: 12, borderWidth: 1, borderColor: sel ? '#F59E0B50' : 'rgba(255,255,255,0.08)', backgroundColor: sel ? 'rgba(245,158,11,0.09)' : GLASS }}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: roleClr + '20', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: roleClr, fontSize: 13, fontFamily: 'Inter_700Bold' }}>{(u.name ?? '?')[0].toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: TEXT, fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>{u.name}</Text>
                    <Text style={{ color: MUTED, fontSize: 10, fontFamily: 'Inter_400Regular' }}>{u.id} · {u.role}</Text>
                  </View>
                  <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: sel ? '#F59E0B' : 'rgba(255,255,255,0.20)', backgroundColor: sel ? '#F59E0B' : 'transparent', justifyContent: 'center', alignItems: 'center' }}>
                    {sel && <Feather name="check" size={12} color="#000" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={{ padding: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', gap: 8 }}>
            {recipientDraft.length > 0 && (
              <Text style={{ color: MUTED, fontSize: 10, fontFamily: 'Inter_400Regular', textAlign: 'center' }}>
                {recipientDraft.length} recipient{recipientDraft.length !== 1 ? 's' : ''} selected
              </Text>
            )}
            <TouchableOpacity
              onPress={() => { saveReportRecipients(recipientDraft); setShowRecipientsModal(false); }}
              disabled={savingRecipients}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#F59E0B', '#D97706']} style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 13, borderRadius: 14 }}>
                {savingRecipients ? <ActivityIndicator size={14} color="#000" /> : <Feather name="save" size={14} color="#000" />}
                <Text style={{ color: '#000', fontSize: 13, fontFamily: 'Inter_700Bold' }}>Save Recipients</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Report table */}
      {report && (
        <View style={{ marginHorizontal: 14, marginTop: 16 }}>
          {/* Report header */}
          <View style={s.reportHeader}>
            <LinearGradient colors={['rgba(99,102,241,0.15)','rgba(79,70,229,0.08)']} style={StyleSheet.absoluteFill as any} />
            <View style={{ flex: 1 }}>
              <Text style={s.reportTitle}>{report.label}</Text>
              <Text style={s.reportSub}>
                {report.rows.length} houses · Generated {new Date(report.generatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            {/* Export + Share buttons — single compact row */}
            <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
              <TouchableOpacity onPress={handleExport} disabled={exporting} activeOpacity={0.8}>
                <LinearGradient colors={['#10B981','#059669']} style={s.exportBtnCompact}>
                  {exporting ? <ActivityIndicator size={11} color="#fff" /> : <>
                    <Feather name="download" size={11} color="#fff" />
                    <Text style={s.exportBtnCompactTxt}>Excel</Text>
                  </>}
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleExportPDF()} disabled={exportingPDF} activeOpacity={0.8}>
                <LinearGradient colors={['#EF4444','#DC2626']} style={s.exportBtnCompact}>
                  {exportingPDF ? <ActivityIndicator size={11} color="#fff" /> : <>
                    <Feather name="file-text" size={11} color="#fff" />
                    <Text style={s.exportBtnCompactTxt}>PDF</Text>
                  </>}
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowShareMenu(true)} activeOpacity={0.8}>
                <LinearGradient colors={['#6366F1','#4F46E5']} style={s.exportBtnCompact}>
                  <Feather name="share-2" size={11} color="#fff" />
                  <Text style={s.exportBtnCompactTxt}>Share</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowRecipientsModal(true)} activeOpacity={0.8} style={{ padding: 5, borderRadius: 8, backgroundColor: reportRecipients.length > 0 ? '#F59E0B18' : 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: reportRecipients.length > 0 ? '#F59E0B40' : 'rgba(255,255,255,0.10)' }}>
                <Feather name="users" size={13} color={reportRecipients.length > 0 ? '#F59E0B' : MUTED} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Legend */}
          <View style={s.legend}>
            {([['P','Collected','#34D399'],['N','Not Collected','#FB7185'],['L','Late','#FBBF24']] as const).map(([code, label, color]) => (
              <View key={code} style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: color }]} />
                <Text style={[s.legendCode, { color }]}>{code}</Text>
                <Text style={s.legendLabel}>{label}</Text>
              </View>
            ))}
          </View>

          {/* Summary stats */}
          {report.rows.length > 0 && (
            <View style={s.summaryRow}>
              {(() => {
                const totP = report.rows.reduce((a, r) => a + r.totalPresent, 0);
                const totN = report.rows.reduce((a, r) => a + r.totalAbsent, 0);
                const totL = report.rows.reduce((a, r) => a + r.totalLate, 0);
                const totAll = totP + totN;
                const avgPct = totAll > 0 ? ((totP / totAll) * 100).toFixed(1) + '%' : '—';
                return [
                  { label: 'Collected', value: totP, color: '#34D399' },
                  { label: 'Missed',    value: totN, color: '#FB7185' },
                  { label: 'Late',      value: totL, color: '#FBBF24' },
                  { label: 'Avg %',     value: avgPct, color: '#818CF8', isStr: true },
                ].map(st => (
                  <View key={st.label} style={[s.summaryCell, { borderColor: st.color + '30', backgroundColor: st.color + '0E' }]}>
                    <Text style={[s.summaryVal, { color: st.color }]}>{st.value}</Text>
                    <Text style={s.summaryLbl}>{st.label}</Text>
                  </View>
                ));
              })()}
            </View>
          )}

          {/* Ward-wise bar chart */}
          {report.rows.length > 0 && <WardChart rows={report.rows} />}

          {/* Attendance analytics */}
          {report.rows.length > 0 && (
            <WardAttendanceChart
              rows={report.rows}
              attendance={attendance}
              users={users}
              wards={wards}
              year={report.year}
              month={report.month}
              quarter={report.quarter}
              type={report.type}
            />
          )}

          {/* Table */}
          {report.type === 'monthly' && (
            <ScrollView horizontal showsHorizontalScrollIndicator style={s.tableWrap}>
              <View>
                <View style={s.tableHdrRow}>
                  <Text style={[s.thCell, { width: 36 }]}>#</Text>
                  <Text style={[s.thCell, { width: 110 }]}>Reg No</Text>
                  <Text style={[s.thCell, { width: 50 }]}>Ward</Text>
                  {report.dayHeaders.map(d => (
                    <Text key={d} style={[s.thCell, s.dayCell]}>{String(d)}</Text>
                  ))}
                  <Text style={[s.thCell, { width: 30 }]}>P</Text>
                  <Text style={[s.thCell, { width: 30 }]}>N</Text>
                  <Text style={[s.thCell, { width: 30 }]}>L</Text>
                  <Text style={[s.thCell, { width: 55 }]}>%</Text>
                </View>
                {report.rows.map((row, ri) => (
                  <View key={row.houseId} style={[s.tableRow, ri % 2 === 0 ? s.tableRowEven : s.tableRowOdd]}>
                    <Text style={[s.tdCell, { width: 36, color: MUTED }]}>{row.sNo}</Text>
                    <Text style={[s.tdCell, { width: 110, color: '#818CF8' }]} numberOfLines={1}>{row.houseRegNo}</Text>
                    <Text style={[s.tdCell, { width: 50, color: TEXT }]}>{row.wardNo}</Text>
                    {report.dayHeaders.map(d => {
                      const status = row.dailyStatus[d] ?? 'N';
                      return (
                        <View key={d} style={[s.dayCell, { alignItems: 'center', justifyContent: 'center' }]}>
                          <Text style={{ fontSize: 10, fontFamily: 'Inter_700Bold', color: getStatusColor(status) }}>{status}</Text>
                        </View>
                      );
                    })}
                    <Text style={[s.tdCell, { width: 30, color: '#34D399' }]}>{row.totalPresent}</Text>
                    <Text style={[s.tdCell, { width: 30, color: '#FB7185' }]}>{row.totalAbsent}</Text>
                    <Text style={[s.tdCell, { width: 30, color: '#FBBF24' }]}>{row.totalLate}</Text>
                    <Text style={[s.tdCell, { width: 55, color: '#818CF8' }]}>{row.percentage}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}

          {/* Quarterly — week-wise columns */}
          {report.type === 'quarterly' && (
            <ScrollView horizontal showsHorizontalScrollIndicator style={s.tableWrap}>
              <View>
                <View style={s.tableHdrRow}>
                  <Text style={[s.thCell, { width: 36 }]}>#</Text>
                  <Text style={[s.thCell, { width: 110 }]}>Reg No</Text>
                  <Text style={[s.thCell, { width: 50 }]}>Ward</Text>
                  {(report.weekHeaders ?? []).map(wh => (
                    <Text key={wh.key} style={[s.thCell, s.weekCell]}>{wh.label}</Text>
                  ))}
                  <Text style={[s.thCell, { width: 30 }]}>P</Text>
                  <Text style={[s.thCell, { width: 30 }]}>N</Text>
                  <Text style={[s.thCell, { width: 30 }]}>L</Text>
                  <Text style={[s.thCell, { width: 55 }]}>%</Text>
                </View>
                {report.rows.map((row, ri) => (
                  <View key={row.houseId} style={[s.tableRow, ri % 2 === 0 ? s.tableRowEven : s.tableRowOdd]}>
                    <Text style={[s.tdCell, { width: 36, color: MUTED }]}>{row.sNo}</Text>
                    <Text style={[s.tdCell, { width: 110, color: '#818CF8' }]} numberOfLines={1}>{row.houseRegNo}</Text>
                    <Text style={[s.tdCell, { width: 50, color: TEXT }]}>{row.wardNo}</Text>
                    {(report.weekHeaders ?? []).map(wh => {
                      const col = row.weeklyCollected?.[wh.key] ?? 0;
                      const tot = wh.totalDays;
                      const ratio = tot > 0 ? col / tot : 0;
                      const clr = ratio >= 0.8 ? '#34D399' : ratio >= 0.5 ? '#FBBF24' : '#FB7185';
                      return (
                        <View key={wh.key} style={[s.weekCell, { alignItems: 'center', justifyContent: 'center' }]}>
                          <Text style={{ fontSize: 10, fontFamily: 'Inter_700Bold', color: clr }}>{col}/{tot}</Text>
                        </View>
                      );
                    })}
                    <Text style={[s.tdCell, { width: 30, color: '#34D399' }]}>{row.totalPresent}</Text>
                    <Text style={[s.tdCell, { width: 30, color: '#FB7185' }]}>{row.totalAbsent}</Text>
                    <Text style={[s.tdCell, { width: 30, color: '#FBBF24' }]}>{row.totalLate}</Text>
                    <Text style={[s.tdCell, { width: 55, color: '#818CF8' }]}>{row.percentage}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}

          {/* Yearly — monthly columns (Jan–Dec) */}
          {report.type === 'yearly' && (
            <ScrollView horizontal showsHorizontalScrollIndicator style={s.tableWrap}>
              <View>
                <View style={s.tableHdrRow}>
                  <Text style={[s.thCell, { width: 36 }]}>#</Text>
                  <Text style={[s.thCell, { width: 110 }]}>Reg No</Text>
                  <Text style={[s.thCell, { width: 50 }]}>Ward</Text>
                  {MONTH_NAMES.map(m => (
                    <Text key={m} style={[s.thCell, s.monthCell]}>{m.slice(0, 3)}</Text>
                  ))}
                  <Text style={[s.thCell, { width: 36 }]}>P</Text>
                  <Text style={[s.thCell, { width: 36 }]}>N</Text>
                  <Text style={[s.thCell, { width: 36 }]}>L</Text>
                  <Text style={[s.thCell, { width: 55 }]}>%</Text>
                </View>
                {report.rows.map((row, ri) => (
                  <View key={row.houseId} style={[s.tableRow, ri % 2 === 0 ? s.tableRowEven : s.tableRowOdd]}>
                    <Text style={[s.tdCell, { width: 36, color: MUTED }]}>{row.sNo}</Text>
                    <Text style={[s.tdCell, { width: 110, color: '#818CF8' }]} numberOfLines={1}>{row.houseRegNo}</Text>
                    <Text style={[s.tdCell, { width: 50, color: TEXT }]}>{row.wardNo}</Text>
                    {Array.from({ length: 12 }, (_, i) => {
                      const md = row.monthlyData?.[i + 1];
                      const p = md?.p ?? 0;
                      const tot = daysInMonth(i + 1, report.year);
                      const ratio = tot > 0 ? p / tot : 0;
                      const clr = ratio >= 0.8 ? '#34D399' : ratio >= 0.5 ? '#FBBF24' : '#FB7185';
                      return (
                        <View key={i} style={[s.monthCell, { alignItems: 'center', justifyContent: 'center' }]}>
                          <Text style={{ fontSize: 10, fontFamily: 'Inter_700Bold', color: clr }}>{p}</Text>
                        </View>
                      );
                    })}
                    <Text style={[s.tdCell, { width: 36, color: '#34D399' }]}>{row.totalPresent}</Text>
                    <Text style={[s.tdCell, { width: 36, color: '#FB7185' }]}>{row.totalAbsent}</Text>
                    <Text style={[s.tdCell, { width: 36, color: '#FBBF24' }]}>{row.totalLate}</Text>
                    <Text style={[s.tdCell, { width: 55, color: '#818CF8' }]}>{row.percentage}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}

          {report.rows.length === 0 && (
            <View style={s.emptyCard}>
              <Feather name="file-text" size={28} color={MUTED} />
              <Text style={s.emptyTitle}>No Houses Found</Text>
              <Text style={s.emptySub}>No house data for the selected period/ward</Text>
            </View>
          )}
        </View>
      )}

      {!report && !generating && (
        <View style={s.emptyCard}>
          <LinearGradient colors={['rgba(99,102,241,0.18)','rgba(79,70,229,0.10)']} style={s.emptyIconBox}>
            <Feather name="bar-chart-2" size={26} color="#818CF8" />
          </LinearGradient>
          <Text style={s.emptyTitle}>No Report Yet</Text>
          <Text style={s.emptySub}>Configure filters above and tap Generate</Text>
        </View>
      )}
    </ScrollView>
  );
}

// ── WardAttendanceChart sub-component ──────────────────────────────
function WardAttendanceChart({
  rows, attendance, users, wards, year, month, quarter, type,
}: {
  rows: import('@/types').HouseCollectionRow[];
  attendance: import('@/types').Attendance[];
  users: import('@/types').User[];
  wards: import('@/types').Ward[];
  year: number;
  month?: number;
  quarter?: number;
  type: ReportType;
}) {
  // Determine date range for this report
  const inRange = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const y = d.getFullYear(), m = d.getMonth() + 1;
    if (y !== year) return false;
    if (type === 'monthly') return m === month;
    if (type === 'quarterly' && quarter) {
      const qStart = (quarter - 1) * 3 + 1;
      return m >= qStart && m <= qStart + 2;
    }
    return true; // yearly
  };

  // Workers per ward (from wards.assignedWorkers)
  const wardEntries = wards
    .filter(w => w.wardNumber)
    .map(w => {
      const wn = Number(w.wardNumber);
      const workerIds = w.assignedWorkers ?? [];
      const safaikarmis = users.filter(u => u.role === 'safaikarmi' && workerIds.includes(u.id));
      const filtered = attendance.filter(a => workerIds.includes(a.workerId) && inRange(a.date));
      const present = filtered.filter(a => a.status === 'present' || a.status === 'half_day').length;
      const attPct = filtered.length > 0 ? (present / filtered.length) * 100 : null;

      // Collection rate from rows
      const wardRows = rows.filter(r => r.wardNo === wn);
      const totP = wardRows.reduce((s, r) => s + r.totalPresent, 0);
      const totD = wardRows.reduce((s, r) => s + r.totalDays, 0);
      const colPct = totD > 0 ? (totP / totD) * 100 : null;

      return { wn, attPct, colPct, workerCount: safaikarmis.length, sampleSize: filtered.length };
    })
    .filter(e => e.colPct !== null || e.attPct !== null)
    .sort((a, b) => a.wn - b.wn);

  if (wardEntries.length < 2) return null;

  const maxPct = 100;

  return (
    <View style={{ marginBottom: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', backgroundColor: 'rgba(255,255,255,0.04)', padding: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <Feather name="user-check" size={13} color="#34D399" />
        <Text style={{ color: '#F0F4FF', fontSize: 12, fontFamily: 'Inter_700Bold' }}>Attendance vs Collection by Ward</Text>
      </View>
      <Text style={{ color: MUTED, fontSize: 10, fontFamily: 'Inter_400Regular', marginBottom: 10 }}>
        Safai Karmi attendance rate alongside collection rate — spot absenteeism-driven gaps
      </Text>

      {/* Legend */}
      <View style={{ flexDirection: 'row', gap: 14, marginBottom: 10 }}>
        {[['#34D399', 'Attendance'], ['#818CF8', 'Collection']].map(([c, l]) => (
          <View key={l} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 10, height: 6, borderRadius: 3, backgroundColor: c }} />
            <Text style={{ color: MUTED, fontSize: 9, fontFamily: 'Inter_400Regular' }}>{l}</Text>
          </View>
        ))}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 10, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.15)' }} />
          <Text style={{ color: MUTED, fontSize: 9, fontFamily: 'Inter_400Regular' }}>No data</Text>
        </View>
      </View>

      {wardEntries.map(({ wn, attPct, colPct, workerCount, sampleSize }) => {
        const attClr = attPct == null ? 'rgba(255,255,255,0.15)' : attPct >= 80 ? '#34D399' : attPct >= 50 ? '#FBBF24' : '#FB7185';
        const colClr = '#818CF8';
        const attW = attPct != null ? (attPct / maxPct) * 100 : 0;
        const colW = colPct != null ? (colPct / maxPct) * 100 : 0;
        const gap = attPct != null && colPct != null ? colPct - attPct : null;
        return (
          <View key={wn} style={{ marginBottom: 9 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
              <Text style={{ color: MUTED, fontSize: 9, fontFamily: 'Inter_600SemiBold', width: 36 }}>W{wn}</Text>
              <View style={{ flex: 1 }}>
                {/* Attendance bar */}
                <View style={{ height: 9, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 5, overflow: 'hidden', marginBottom: 3 }}>
                  <View style={{ width: `${attW}%`, height: 9, backgroundColor: attPct == null ? 'rgba(255,255,255,0.12)' : attClr, borderRadius: 5, opacity: attPct == null ? 0.5 : 1 }} />
                </View>
                {/* Collection bar */}
                <View style={{ height: 9, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 5, overflow: 'hidden' }}>
                  <View style={{ width: `${colW}%`, height: 9, backgroundColor: colPct == null ? 'rgba(255,255,255,0.12)' : colClr, borderRadius: 5, opacity: colPct == null ? 0.5 : 1 }} />
                </View>
              </View>
              <View style={{ width: 72, alignItems: 'flex-end', gap: 3 }}>
                <Text style={{ color: attPct == null ? MUTED : attClr, fontSize: 9, fontFamily: 'Inter_700Bold' }}>
                  {attPct == null ? `—  (${workerCount}w)` : `${attPct.toFixed(0)}%  (${workerCount}w)`}
                </Text>
                <Text style={{ color: colPct == null ? MUTED : colClr, fontSize: 9, fontFamily: 'Inter_700Bold' }}>
                  {colPct == null ? '—' : `${colPct.toFixed(0)}%`}
                </Text>
              </View>
            </View>
            {/* Gap insight */}
            {gap != null && gap < -15 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 36 }}>
                <Feather name="alert-circle" size={9} color="#FBBF24" />
                <Text style={{ color: '#FBBF24', fontSize: 8, fontFamily: 'Inter_400Regular' }}>
                  Collection {Math.abs(gap).toFixed(0)}% below attendance — check house visit logs
                </Text>
              </View>
            )}
            {gap != null && attPct! < 60 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 36 }}>
                <Feather name="user-x" size={9} color="#FB7185" />
                <Text style={{ color: '#FB7185', fontSize: 8, fontFamily: 'Inter_400Regular' }}>
                  Low worker attendance — possible cause of missed collections
                </Text>
              </View>
            )}
          </View>
        );
      })}

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 2 }}>
        {[['#34D399','≥80%'],['#FBBF24','50–79%'],['#FB7185','<50%']].map(([c,l]) => (
          <View key={l} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c }} />
            <Text style={{ color: 'rgba(255,255,255,0.40)', fontSize: 8, fontFamily: 'Inter_400Regular' }}>{l} Attendance</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── WardChart sub-component ────────────────────────────────────────
function WardChart({ rows }: { rows: import('@/types').HouseCollectionRow[] }) {
  const wardMap: Record<number, { p: number; tot: number }> = {};
  for (const row of rows) {
    const wn = row.wardNo ?? 0;
    if (!wardMap[wn]) wardMap[wn] = { p: 0, tot: 0 };
    wardMap[wn].p   += row.totalPresent;
    wardMap[wn].tot += row.totalDays;
  }
  const entries = Object.entries(wardMap).sort(([a],[b]) => Number(a)-Number(b));
  if (entries.length < 2) return null;

  const maxPct = Math.max(...entries.map(([, d]) => d.tot > 0 ? (d.p / d.tot) * 100 : 0), 1);

  return (
    <View style={{ marginBottom: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', backgroundColor: 'rgba(255,255,255,0.04)', padding: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <Feather name="bar-chart-2" size={13} color="#818CF8" />
        <Text style={{ color: '#F0F4FF', fontSize: 12, fontFamily: 'Inter_700Bold' }}>Ward-wise Collection</Text>
      </View>
      {entries.map(([wn, d]) => {
        const pct = d.tot > 0 ? (d.p / d.tot) * 100 : 0;
        const barW = maxPct > 0 ? (pct / maxPct) * 100 : 0;
        const clr = pct >= 80 ? '#34D399' : pct >= 50 ? '#FBBF24' : '#FB7185';
        return (
          <View key={wn} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 7 }}>
            <Text style={{ color: 'rgba(255,255,255,0.50)', fontSize: 9, fontFamily: 'Inter_600SemiBold', width: 36 }}>W{wn}</Text>
            <View style={{ flex: 1, height: 12, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 6, overflow: 'hidden' }}>
              <View style={{ width: `${barW}%`, height: 12, backgroundColor: clr, borderRadius: 6 }} />
            </View>
            <Text style={{ color: clr, fontSize: 10, fontFamily: 'Inter_700Bold', width: 36, textAlign: 'right' }}>{pct.toFixed(0)}%</Text>
          </View>
        );
      })}
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
        {[['#34D399','≥80% Good'],['#FBBF24','50–79% Avg'],['#FB7185','<50% Poor']].map(([c,l]) => (
          <View key={l} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c }} />
            <Text style={{ color: 'rgba(255,255,255,0.40)', fontSize: 8, fontFamily: 'Inter_400Regular' }}>{l}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── HistoryCard sub-component ───────────────────────────────────────
function HistoryCard({ r, isActive, inMemory, selected, onPress, onLongPress, onExportPDF, last }: {
  r: HistoryEntry; isActive: boolean; inMemory: boolean; selected?: boolean; onPress: () => void;
  onLongPress?: () => void; onExportPDF?: () => void; last: boolean;
}) {
  const color = r.type === 'monthly' ? '#0EA5E9' : r.type === 'quarterly' ? '#818CF8' : '#34D399';
  const icon  = r.type === 'monthly' ? 'calendar' : r.type === 'quarterly' ? 'bar-chart-2' : 'trending-up';
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      style={[s.histCard, isActive && s.histCardActive, selected && { borderColor: '#FB718590', backgroundColor: '#FB71850E' }, last && { marginBottom: 0 }]}
      activeOpacity={0.75}
    >
      <View style={[s.histCardIcon, { backgroundColor: color + '18' }]}>
        <Feather name={icon as any} size={16} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.histCardLabel} numberOfLines={1}>{r.label}</Text>
        <Text style={s.histCardSub}>
          {new Date(r.generatedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </Text>
        <View style={s.histCardMeta}>
          <Feather name="home" size={9} color="rgba(255,255,255,0.30)" />
          <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, fontFamily: 'Inter_400Regular' }}>{r.rowCount} houses</Text>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        {inMemory && onExportPDF && (
          <TouchableOpacity
            onPress={e => { e.stopPropagation?.(); onExportPDF(); }}
            style={{ backgroundColor: '#EF444420', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, flexDirection: 'row', alignItems: 'center', gap: 3 }}
            activeOpacity={0.7}
          >
            <Feather name="file-text" size={9} color="#EF4444" />
            <Text style={{ color: '#EF4444', fontSize: 9, fontFamily: 'Inter_700Bold' }}>PDF</Text>
          </TouchableOpacity>
        )}
        {inMemory && (
          <View style={{ backgroundColor: color + '20', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
            <Text style={{ color, fontSize: 9, fontFamily: 'Inter_700Bold' }}>VIEW</Text>
          </View>
        )}
        <Feather name="chevron-right" size={14} color={inMemory ? color : 'rgba(255,255,255,0.20)'} />
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  tabRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  tabPill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: 'transparent', backgroundColor: GLASS, minWidth: 90 },
  tabLabel: { fontSize: 12 },

  histModal: { backgroundColor: '#0D1226', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '72%', borderTopWidth: 1, borderTopColor: 'rgba(245,158,11,0.25)' },
  histHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  histHeaderTxt: { color: '#F0F4FF', fontSize: 15, fontFamily: 'Inter_700Bold' },
  histFilterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  histFilterPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: GLASS },
  histFilterTxt: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: MUTED },
  histCatHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  histCatLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 0.4, flex: 1 },
  histCatBadge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  histCatBadgeTxt: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  histCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', backgroundColor: GLASS, marginBottom: 8 },
  histCardActive: { borderColor: 'rgba(245,158,11,0.40)', backgroundColor: 'rgba(245,158,11,0.07)' },
  histCardIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  histCardLabel: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#F0F4FF' },
  histCardSub: { fontSize: 10, fontFamily: 'Inter_400Regular', color: MUTED, marginTop: 2 },
  histCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  histEmpty: { alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 },
  histEmptyTxt: { color: MUTED, fontSize: 12, fontFamily: 'Inter_400Regular' },

  configCard: { marginHorizontal: 14, borderRadius: 18, borderWidth: 1, borderColor: GLASS_BD, padding: 10, overflow: 'hidden' },
  cfgLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', color: MUTED, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 5 },
  pillRow: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  optPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: GLASS_BD, backgroundColor: GLASS },
  optPillTxt: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: MUTED },
  pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  monthPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1, borderColor: GLASS_BD, backgroundColor: GLASS },
  monthPillTxt: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: MUTED },
  wardPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: GLASS_BD, backgroundColor: GLASS },
  wardPillTxt: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: MUTED },
  genBtn: { borderRadius: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  genBtnTxt: { color: '#fff', fontSize: 12, fontFamily: 'Inter_700Bold' },

  reportHeader: { borderRadius: 16, borderWidth: 1, borderColor: GLASS_BD, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, overflow: 'hidden', marginBottom: 12 },
  reportTitle: { color: TEXT, fontSize: 14, fontFamily: 'Inter_700Bold' },
  reportSub: { color: MUTED, fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  exportBtnWide: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  exportBtnWideTxt: { color: '#fff', fontSize: 12, fontFamily: 'Inter_700Bold' },
  exportBtnCompact: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  exportBtnCompactTxt: { color: '#fff', fontSize: 10, fontFamily: 'Inter_700Bold' },

  legend: { flexDirection: 'row', gap: 14, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendCode: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  legendLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: MUTED },

  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  summaryCell: { flex: 1, borderRadius: 12, borderWidth: 1, paddingVertical: 8, alignItems: 'center' },
  summaryVal: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  summaryLbl: { fontSize: 9, fontFamily: 'Inter_500Medium', color: MUTED, marginTop: 2 },

  tableWrap: { borderRadius: 14, borderWidth: 1, borderColor: GLASS_BD, overflow: 'hidden', backgroundColor: GLASS },
  tableHdrRow: { flexDirection: 'row', backgroundColor: 'rgba(99,102,241,0.12)', paddingVertical: 8, paddingHorizontal: 6 },
  thCell: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#818CF8', textTransform: 'uppercase', letterSpacing: 0.3, paddingHorizontal: 3, textAlign: 'center' },
  dayCell: { width: 22, paddingHorizontal: 1 },
  weekCell: { width: 38, paddingHorizontal: 2 },
  monthCell: { width: 34, paddingHorizontal: 2 },
  tableRow: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 6, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  tableRowEven: { backgroundColor: 'transparent' },
  tableRowOdd: { backgroundColor: 'rgba(255,255,255,0.025)' },
  tdCell: { fontSize: 10, fontFamily: 'Inter_600SemiBold', paddingHorizontal: 3, textAlign: 'center', alignSelf: 'center' },

  emptyCard: { marginHorizontal: 14, marginTop: 30, borderRadius: 18, borderWidth: 1, borderColor: GLASS_BD, padding: 40, alignItems: 'center', gap: 12, backgroundColor: GLASS },
  emptyIconBox: { width: 60, height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { color: TEXT, fontSize: 15, fontFamily: 'Inter_700Bold' },
  emptySub: { color: MUTED, fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' },
});
