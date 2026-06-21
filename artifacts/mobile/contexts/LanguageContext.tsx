import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type Language = 'en' | 'hi';

const translations = {
  en: {
    appName: 'DNP360',
    cityName: 'Daudnagar',
    nagar: 'Nagar Parishad Daudnagar',
    home: 'Home',
    complaints: 'Complaints',
    notices: 'Notices',
    emergency: 'Emergency',
    profile: 'Profile',
    management: 'Management',
    workers: 'Workers',
    houses: 'Houses',
    keys: 'Keys',
    users: 'Users',
    attendance: 'Attendance',
    scan: 'Scan',
    performance: 'Performance',
    signIn: 'Sign In',
    signOut: 'Sign Out',
    welcome: 'Welcome Back',
    createAccount: 'Create Account',
    forgotPassword: 'Forgot Password?',
    submit: 'Submit',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    search: 'Search',
    language: 'Language',
    english: 'English',
    hindi: 'हिंदी',
    pending: 'Pending',
    resolved: 'Resolved',
    inProgress: 'In Progress',
    assigned: 'Assigned',
    active: 'Active',
    inactive: 'Inactive',
    ward: 'Ward',
    total: 'Total',
    citizen: 'Citizen',
    official: 'Official',
    admin: 'Admin',
    safaikarmi: 'Safai Karmi',
    smartGovernance: 'Smart Governance · Digital India',
    noData: 'No data found',
    loading: 'Loading…',
    requestReset: 'Request Password Reset',
    checkStatus: 'Check Status',
    statusPending: 'Pending Review',
    statusApproved: 'Approved',
    statusRejected: 'Rejected',
    adminNote: 'Note from Admin',
    mobileLogin: 'Login with Mobile',
    emailLogin: 'Login with Email',
  },
  hi: {
    appName: 'DNP360',
    cityName: 'दाऊदनगर',
    nagar: 'नगर परिषद दाऊदनगर',
    home: 'होम',
    complaints: 'शिकायतें',
    notices: 'सूचनाएं',
    emergency: 'आपातकाल',
    profile: 'प्रोफ़ाइल',
    management: 'प्रबंधन',
    workers: 'कार्यकर्ता',
    houses: 'घर',
    keys: 'चाबियां',
    users: 'उपयोगकर्ता',
    attendance: 'उपस्थिति',
    scan: 'स्कैन',
    performance: 'प्रदर्शन',
    signIn: 'साइन इन',
    signOut: 'साइन आउट',
    welcome: 'वापसी पर स्वागत',
    createAccount: 'खाता बनाएं',
    forgotPassword: 'पासवर्ड भूल गए?',
    submit: 'जमा करें',
    save: 'सहेजें',
    cancel: 'रद्द करें',
    delete: 'हटाएं',
    edit: 'संपादित करें',
    search: 'खोजें',
    language: 'भाषा',
    english: 'English',
    hindi: 'हिंदी',
    pending: 'लंबित',
    resolved: 'हल किया',
    inProgress: 'प्रगति में',
    assigned: 'सौंपा गया',
    active: 'सक्रिय',
    inactive: 'निष्क्रिय',
    ward: 'वार्ड',
    total: 'कुल',
    citizen: 'नागरिक',
    official: 'अधिकारी',
    admin: 'व्यवस्थापक',
    safaikarmi: 'सफाई कर्मी',
    smartGovernance: 'स्मार्ट शासन · डिजिटल भारत',
    noData: 'कोई डेटा नहीं मिला',
    loading: 'लोड हो रहा है…',
    requestReset: 'पासवर्ड रीसेट अनुरोध',
    checkStatus: 'स्थिति जांचें',
    statusPending: 'समीक्षाधीन',
    statusApproved: 'स्वीकृत',
    statusRejected: 'अस्वीकृत',
    adminNote: 'व्यवस्थापक का नोट',
    mobileLogin: 'मोबाइल से लॉगिन',
    emailLogin: 'ईमेल से लॉगिन',
  },
};

export type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    AsyncStorage.getItem('dnp360_language').then(stored => {
      if (stored === 'en' || stored === 'hi') setLanguageState(stored);
    }).catch(() => {});
  }, []);

  async function setLanguage(lang: Language) {
    setLanguageState(lang);
    await AsyncStorage.setItem('dnp360_language', lang).catch(() => {});
  }

  function t(key: TranslationKey): string {
    return translations[language][key] ?? translations.en[key] ?? key;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
