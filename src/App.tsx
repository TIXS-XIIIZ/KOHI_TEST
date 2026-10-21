import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Battery,
  Bell,
  Calendar as CalendarIcon,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Code2,
  Copy,
  Crown,
  Download,
  Eye,
  EyeOff,
  FileImage,
  FolderTree,
  HardDrive,
  Lock,
  Moon,
  Plus,
  QrCode,
  Search,
  Settings,
  Share2,
  Shield,
  ShieldCheck,
  Signal,
  Smartphone,
  Sparkles,
  Sun,
  Trash2,
  Undo2,
  Upload,
  UserPlus,
  Users,
  Wallet,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import { AppColors, EraType, LocaleCode, ThemeMode } from './theme/appColors';
import {
  BankAccount,
  CategoryItem,
  CategoryRule,
  FamilyMember,
  ParsedSlipOrQrDraft,
  StoredSlipImage,
  SubscriptionPlan,
  TransactionRecord,
} from './types/kohi';
import {
  DEFAULT_CATEGORIES,
  INITIAL_CATEGORY_RULES,
  INITIAL_SLIP_IMAGES,
  INITIAL_TRANSACTIONS,
  PRELOADED_ALBUM_SLIPS,
  PRELOADED_NOTIFICATIONS,
  PreloadedBankNotification,
  SampleAlbumSlip,
  THAI_BANKS_AND_WALLETS,
} from './data/seedData';
import { FLUTTER_PROJECT_FILES, FlutterSourceFile } from './data/flutterProjectFiles';
import {
  formatMonthHeader,
  formatTHB,
  formatThaiDateShort,
} from './utils/formatters';
import { compressSlipImageFile, formatBytes } from './utils/imageCompressor';
import {
  matchCategoryByRules,
  parseThaiBankNotification,
  parseThaiPromptPayQr,
  parseThaiSlipOcrText,
} from './utils/thaiParsers';
import { KohiMascotIcon } from './components/KohiMascotIcon';
import { MobileInstallModal } from './components/MobileInstallModal';

type MobileTab = 'home' | 'calendar' | 'scan' | 'automation' | 'settings';
type DeviceOs = 'ios' | 'android';

export default function App() {
  // ── Device Simulator & Preferences ───────────────────────────────────────
  const [deviceOs, setDeviceOs] = useState<DeviceOs>('ios');
  const [locale, setLocale] = useState<LocaleCode>('th');
  const [era, setEra] = useState<EraType>('BE');
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [hideBalances, setHideBalances] = useState(false);
  const [activeTab, setActiveTab] = useState<MobileTab>('home');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // ── Core Data State ──────────────────────────────────────────────────────
  const [accounts] = useState<BankAccount[]>(THAI_BANKS_AND_WALLETS);
  const [categories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);
  const [rules, setRules] = useState<CategoryRule[]>(INITIAL_CATEGORY_RULES);
  const [transactions, setTransactions] = useState<TransactionRecord[]>(() => {
    const saved = localStorage.getItem('kohi_transactions_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_TRANSACTIONS;
      }
    }
    return INITIAL_TRANSACTIONS;
  });
  const [slipImages, setSlipImages] = useState<StoredSlipImage[]>(
    INITIAL_SLIP_IMAGES
  );

  useEffect(() => {
    localStorage.setItem('kohi_transactions_v1', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [themeMode]);

  // ── Permissions & Automation State ───────────────────────────────────────
  const [albumPermissionGranted, setAlbumPermissionGranted] = useState(true);
  const [androidNotifEnabled, setAndroidNotifEnabled] = useState(false);
  const [autoSaveNotif, setAutoSaveNotif] = useState(true);
  const [incomingNotifBanner, setIncomingNotifBanner] = useState<{
    appName: string;
    message: string;
    isDuplicate?: boolean;
  } | null>(null);
  const [showAppOpenSlipPrompt, setShowAppOpenSlipPrompt] = useState(true);

  // ── Slip / QR Scanner Sheet Inside Phone ─────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [scanSubMode, setScanSubMode] = useState<'album' | 'qr'>('album');
  const [isParsingSlip, setIsParsingSlip] = useState(false);
  const [activeSlipDraft, setActiveSlipDraft] =
    useState<ParsedSlipOrQrDraft | null>(null);
  const [customQrPayload, setCustomQrPayload] = useState(
    '00020101021229370016A000000677010111011300668912348215303764540585.005802TH63044A9B'
  );
  const [learnMerchantRule, setLearnMerchantRule] = useState(true);

  // ── Quick Add Sheet Inside Phone ─────────────────────────────────────────
  const [isQuickAddSheetOpen, setIsQuickAddSheetOpen] = useState(false);
  const [newTxType, setNewTxType] = useState<'income' | 'expense'>('expense');
  const [newTxAmount, setNewTxAmount] = useState('85');
  const [newTxNote, setNewTxNote] = useState('กาแฟดริปเย็น (Iced Drip Coffee)');
  const [newTxAccountId, setNewTxAccountId] = useState('acc_kbank');
  const [newTxCategoryId, setNewTxCategoryId] = useState('cat_coffee');

  // ── Calendar & Filter State ──────────────────────────────────────────────
  const [calYear, setCalYear] = useState(2026);
  const [calMonth, setCalMonth] = useState(9); // Oct 2026
  const [selectedCalDay, setSelectedCalDay] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>(
    'all'
  );
  const [deletedTxUndo, setDeletedTxUndo] = useState<TransactionRecord | null>(
    null
  );

  // ── Security App Lock (Inside Phone) ─────────────────────────────────────
  const [isPhoneLocked, setIsPhoneLocked] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // ── Subscription & Family Sharing State ──────────────────────────────────
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan>('free');
  const [settingsSubView, setSettingsSubView] = useState<
    'main' | 'paywall' | 'family' | 'storage'
  >('main');
  const [notifyPremium, setNotifyPremium] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
    {
      id: 'fam_1',
      nickname: 'คุณธีรภัทร (Owner)',
      email: 'thewakool.ch@gmail.com',
      role: 'owner',
      shareIncome: true,
      shareExpense: true,
      monthlyIncomeShared: 63700,
      monthlyExpenseShared: 12039,
      lastSyncedAt: '2026-10-20T11:30:00+07:00',
    },
    {
      id: 'fam_2',
      nickname: 'พี่พลอย (Member)',
      email: 'ploy.wong@gmail.com',
      role: 'member',
      shareIncome: false,
      shareExpense: true,
      monthlyIncomeShared: 48000,
      monthlyExpenseShared: 9450,
      lastSyncedAt: '2026-10-20T10:15:00+07:00',
    },
  ]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');

  // ── Right Panel: Code Explorer State ─────────────────────────────────────
  const [rightPanelTab, setRightPanelTab] = useState<'tester' | 'code'>(
    'tester'
  );
  const [selectedCodeFile, setSelectedCodeFile] = useState<FlutterSourceFile>(
    FLUTTER_PROJECT_FILES[0]
  );
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const t = (th: string, en: string) => (locale === 'th' ? th : en);

  // ── Aggregations ─────────────────────────────────────────────────────────
  const summaryStats = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of transactions) {
      if (tx.type === 'income') income += tx.amount;
      else expense += tx.amount;
    }
    return { income, expense, net: income - expense };
  }, [transactions]);

  const accountBalances = useMemo(() => {
    const map: Record<string, number> = {};
    for (const acc of accounts) map[acc.id] = acc.initialBalance;
    for (const tx of transactions) {
      map[tx.accountId] =
        (map[tx.accountId] || 0) +
        (tx.type === 'income' ? tx.amount : -tx.amount);
    }
    return map;
  }, [accounts, transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        if (filterType !== 'all' && tx.type !== filterType) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            tx.note.toLowerCase().includes(q) ||
            (tx.receiverName || '').toLowerCase().includes(q) ||
            (tx.referenceNo || '').toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }, [transactions, filterType, searchQuery]);

  // Calendar SQL-style GROUP BY day
  const dailyCalendarMap = useMemo(() => {
    const map: Record<
      number,
      { income: number; expense: number; items: TransactionRecord[] }
    > = {};
    for (const tx of transactions) {
      const d = new Date(tx.timestamp);
      if (d.getFullYear() === calYear && d.getMonth() === calMonth) {
        const day = d.getDate();
        if (!map[day]) map[day] = { income: 0, expense: 0, items: [] };
        if (tx.type === 'income') map[day].income += tx.amount;
        else map[day].expense += tx.amount;
        map[day].items.push(tx);
      }
    }
    return map;
  }, [transactions, calYear, calMonth]);

  // Category 8-color chart breakdown
  const categoryChartSlices = useMemo(() => {
    const map: Record<string, number> = {};
    let totalExp = 0;
    for (const tx of transactions) {
      if (tx.type !== 'expense') continue;
      map[tx.categoryId] = (map[tx.categoryId] || 0) + tx.amount;
      totalExp += tx.amount;
    }
    const sorted = Object.entries(map)
      .map(([catId, amount]) => {
        const cat = categories.find((c) => c.id === catId);
        return {
          catId,
          name: cat ? (locale === 'th' ? cat.nameTh : cat.nameEn) : catId,
          amount,
          pct: totalExp > 0 ? (amount / totalExp) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return sorted.slice(0, 8).map((s, idx) => ({
      ...s,
      color: AppColors.chartPalette[idx % AppColors.chartPalette.length],
    }));
  }, [transactions, categories, locale]);

  const totalSlipStorageBytes = useMemo(
    () => slipImages.reduce((acc, img) => acc + img.compressedSizeBytes, 0),
    [slipImages]
  );

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleSelectSampleSlip = (slip: SampleAlbumSlip) => {
    setIsParsingSlip(true);
    setTimeout(() => {
      const parsed = parseThaiSlipOcrText(
        slip.rawOcrText,
        rules,
        categories,
        transactions,
        slip.emvQrPayload
      );
      const mockImg: StoredSlipImage = {
        id: `img_${Date.now()}`,
        fileName: `${slip.bankCode.toLowerCase()}_${slip.referenceNo}.webp`,
        compressedDataUrl: '',
        thumbnailDataUrl: '',
        originalSizeBytes: 1580000,
        compressedSizeBytes: 86400,
        width: 720,
        height: 1280,
        exifStripped: true,
        encryptedAesGcm: true,
        createdAt: new Date().toISOString(),
      };
      setActiveSlipDraft({
        ...parsed,
        amount: slip.amount,
        senderName: slip.sender,
        receiverName: slip.receiver,
        referenceNo: slip.referenceNo,
        memo: slip.memo,
        timestamp: slip.timestampIso,
        slipImage: mockImg,
      });
      setIsParsingSlip(false);
      setActiveTab('scan');
    }, 150);
  };

  const handleRealSlipFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsParsingSlip(true);
    try {
      const compressed = await compressSlipImageFile(file);
      const simulatedOcr = `โอนเงินสำเร็จ\n20 ต.ค. 69 12:20 น.\nจำนวน: 95.00 บาท\nไปยัง: ร้านกาแฟพิเศษ (${file.name})\nรหัสอ้างอิง: SLIP${Date.now().toString().slice(-10)}\nบันทึก: สแกนจากอัลบั้มรูป`;
      const parsed = parseThaiSlipOcrText(
        simulatedOcr,
        rules,
        categories,
        transactions
      );
      setActiveSlipDraft({
        ...parsed,
        slipImage: compressed,
      });
      setActiveTab('scan');
    } finally {
      setIsParsingSlip(false);
    }
  };

  const handleConfirmSlipDraft = () => {
    if (!activeSlipDraft) return;
    const newTx: TransactionRecord = {
      id: `tx_${Date.now()}`,
      amount: activeSlipDraft.amount,
      type: activeSlipDraft.type,
      categoryId: activeSlipDraft.categoryId,
      accountId: activeSlipDraft.accountId,
      timestamp: activeSlipDraft.timestamp,
      note: activeSlipDraft.memo || activeSlipDraft.receiverName,
      tags: [activeSlipDraft.bankCode.toLowerCase(), activeSlipDraft.source],
      referenceNo: activeSlipDraft.referenceNo,
      senderName: activeSlipDraft.senderName,
      receiverName: activeSlipDraft.receiverName,
      source: activeSlipDraft.source,
      slipImageId: activeSlipDraft.slipImage?.id,
    };

    setTransactions((prev) => [newTx, ...prev]);
    if (activeSlipDraft.slipImage) {
      setSlipImages((prev) => [
        { ...activeSlipDraft.slipImage!, transactionId: newTx.id },
        ...prev,
      ]);
    }
    if (learnMerchantRule && activeSlipDraft.receiverName.trim().length > 2) {
      const kw = activeSlipDraft.receiverName.trim().toLowerCase();
      setRules((prev) =>
        prev.some((r) => r.keyword.toLowerCase() === kw)
          ? prev
          : [
              {
                id: `rule_${Date.now()}`,
                keyword: kw,
                categoryId: activeSlipDraft.categoryId,
                learnedFromUser: true,
                hitCount: 1,
              },
              ...prev,
            ]
      );
    }
    setActiveSlipDraft(null);
    setActiveTab('home');
  };

  const handleSimulateBankNotification = (notif: PreloadedBankNotification) => {
    const draft = parseThaiBankNotification(
      {
        packageName: notif.packageName,
        bodyTh: notif.bodyTh,
        timestampIso: notif.timestampIso,
      },
      rules,
      categories,
      transactions
    );

    if (draft.duplicateOfId) {
      setIncomingNotifBanner({
        appName: notif.appName,
        message: t(
          `ตรวจพบรายการซ้ำ (฿${draft.amount} · Ref: ${draft.referenceNo}) ระบบข้ามการบันทึกซ้ำอัตโนมัติ`,
          `Duplicate detected (฿${draft.amount} · Ref: ${draft.referenceNo}) — skipped!`
        ),
        isDuplicate: true,
      });
      setTimeout(() => setIncomingNotifBanner(null), 5000);
      return;
    }

    if (autoSaveNotif) {
      const newTx: TransactionRecord = {
        id: `tx_${Date.now()}`,
        amount: draft.amount,
        type: draft.type,
        categoryId: draft.categoryId,
        accountId: draft.accountId,
        timestamp: draft.timestamp,
        note: draft.memo,
        tags: [draft.bankCode.toLowerCase(), 'notification'],
        referenceNo: draft.referenceNo,
        senderName: draft.senderName,
        receiverName: draft.receiverName,
        source: 'notification',
      };
      setTransactions((prev) => [newTx, ...prev]);
      setIncomingNotifBanner({
        appName: notif.appName,
        message: t(
          `บันทึกอัตโนมัติ: ${draft.type === 'income' ? '+' : '-'}฿${draft.amount.toLocaleString()} (${draft.receiverName})`,
          `Auto-saved: ${draft.type === 'income' ? '+' : '-'}฿${draft.amount.toLocaleString()}`
        ),
      });
      setTimeout(() => setIncomingNotifBanner(null), 5000);
    } else {
      setActiveSlipDraft(draft);
      setActiveTab('scan');
    }
  };

  const handleQuickAddSave = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newTxAmount);
    if (isNaN(amt) || amt <= 0) return;
    const tx: TransactionRecord = {
      id: `tx_${Date.now()}`,
      amount: amt,
      type: newTxType,
      categoryId: newTxCategoryId,
      accountId: newTxAccountId,
      timestamp: new Date('2026-10-20T13:15:00+07:00').toISOString(),
      note: newTxNote.trim() || 'รายการบันทึกด่วน',
      tags: ['manual'],
      referenceNo: `MAN${Date.now().toString().slice(-8)}`,
      source: 'manual',
    };
    setTransactions((prev) => [tx, ...prev]);
    setIsQuickAddSheetOpen(false);
  };

  const handleExportCsv = () => {
    const header =
      'ID,Date_ISO,Type,Amount_THB,Category,Account,Reference_No,Merchant,Source,Note\n';
    const rows = transactions
      .map(
        (tx) =>
          `"${tx.id}","${tx.timestamp}","${tx.type}",${tx.amount},"${tx.categoryId}","${tx.accountId}","${tx.referenceNo || ''}","${(tx.receiverName || '').replace(/"/g, '""')}","${tx.source}","${tx.note.replace(/"/g, '""')}"`
      )
      .join('\n');
    const blob = new Blob(['\uFEFF' + header + rows], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kohi_transactions.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadFullFlutterBundle = () => {
    const bundleText = FLUTTER_PROJECT_FILES.map(
      (f) =>
        `================================================================================\nFILE: ${f.path}\nDESCRIPTION: ${f.descriptionEn}\n================================================================================\n\n${f.content}\n\n`
    ).join('\n');
    const blob = new Blob([bundleText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kohi_flutter_ios_android_source_bundle.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayWeekday = new Date(calYear, calMonth, 1).getDay();
  const selectedDayDetails = dailyCalendarMap[selectedCalDay] || {
    income: 0,
    expense: 0,
    items: [],
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: 'var(--bg-canvas)',
        color: 'var(--text-primary)',
      }}
    >
      {/* ── MINIMAL SINGLE-ROW TOP BAR ─────────────────────────────────────── */}
      <header
        className="flex items-center justify-between gap-4 px-4 sm:px-6 py-2.5 border-b sticky top-0 z-30"
        style={{
          backgroundColor: 'var(--bg-canvas)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('home');
          }}
          className="text-base sm:text-lg font-extrabold tracking-tight whitespace-nowrap shrink-0"
          style={{ color: 'var(--text-brand)' }}
        >
          Kōhī จิบกาแฟ
        </a>

        <div className="flex items-center shrink-0">
          <button
            onClick={() => setIsInstallModalOpen(true)}
            className="min-h-[38px] px-3.5 py-1.5 text-xs font-bold rounded-xl transition-opacity hover:opacity-90 whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 shadow-sm"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--accent-on-primary)',
            }}
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              {t(
                'ติดตั้งลงมือถือ',
                'Install App'
              )}
            </span>
          </button>
        </div>
      </header>

      {/* ── MAIN WORKSPACE: RESPONSIVE MULTI-COLUMN LAYOUT ─────────────────── */}
      <main className="max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start flex-1">
        {/* ══════════════════════════════════════════════════════════════════
            LEFT COLUMN (5 COLS): INTERACTIVE iOS / ANDROID MOBILE PHONE FRAME
            ══════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-5 flex flex-col items-center w-full">
          {/* Unified Device OS & Language/Theme Bar Above Phone */}
          <div className="w-full max-w-[400px] mb-3 flex flex-wrap items-center justify-between gap-2">
            <button
              onClick={() => setDeviceOs(deviceOs === 'ios' ? 'android' : 'ios')}
              className="px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer flex items-center gap-2 transition-all"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-accent)',
              }}
            >
              <Smartphone className="w-3.5 h-3.5" style={{ color: 'var(--accent-secondary)' }} />
              <span>
                {deviceOs === 'ios'
                  ? 'iOS (iPhone 16 Pro) ⇄ Android'
                  : 'Android (Pixel 9 Pro) ⇄ iOS'}
              </span>
            </button>

            <div className="flex items-center gap-1.5 text-xs">
              <button
                onClick={() => setLocale(locale === 'th' ? 'en' : 'th')}
                className="px-2.5 py-1.5 rounded-lg border font-bold cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                {locale === 'th' ? 'TH' : 'EN'}
              </button>
              <button
                onClick={() => setEra(era === 'BE' ? 'CE' : 'BE')}
                className="px-2.5 py-1.5 rounded-lg border font-bold font-mono-tabular cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                {era === 'BE' ? 'พ.ศ. 2569' : '2026'}
              </button>
              <button
                onClick={() =>
                  setThemeMode(themeMode === 'light' ? 'dark' : 'light')
                }
                className="p-1.5 rounded-lg border cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                }}
                aria-label="Toggle theme"
              >
                {themeMode === 'light' ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* ── PHYSICAL MOBILE PHONE SHELL (Responsive on Mobile & Desktop) ── */}
          <div
            className="w-full max-w-[400px] h-[720px] sm:h-[790px] rounded-[36px] sm:rounded-[52px] p-2 sm:p-3 shadow-2xl border-2 sm:border-4 relative flex flex-col select-none"
            style={{
              backgroundColor: '#23120B',
              borderColor: '#56301D',
            }}
          >
            {/* Inner Screen Viewport */}
            <div
              className="w-full h-full rounded-[28px] sm:rounded-[40px] overflow-hidden flex flex-col relative border"
              style={{
                backgroundColor: 'var(--bg-canvas)',
                color: 'var(--text-primary)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              {/* 1. Native iOS Dynamic Island / Android Punch-Hole Status Bar */}
              <div
                className="px-6 pt-3 pb-2 flex items-center justify-between text-[11px] font-bold shrink-0 relative z-20"
                style={{ backgroundColor: 'var(--bg-canvas)' }}
              >
                <span className="font-mono-tabular">09:41</span>

                {deviceOs === 'ios' ? (
                  /* iOS Dynamic Island */
                  <div className="w-24 h-5 rounded-full bg-black flex items-center justify-end px-2">
                    <div className="w-2 h-2 rounded-full bg-[#1a1a2e]" />
                  </div>
                ) : (
                  /* Android Punch-hole Camera */
                  <div className="w-3.5 h-3.5 rounded-full bg-black" />
                )}

                <div className="flex items-center gap-1.5">
                  <Signal className="w-3 h-3" />
                  <Wifi className="w-3 h-3" />
                  <Battery className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Floating Push Notification Toast Inside Phone */}
              {incomingNotifBanner && (
                <div
                  className="mx-3 mt-1 p-3 rounded-2xl border shadow-lg flex items-start gap-2.5 z-30 text-xs"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: incomingNotifBanner.isDuplicate
                      ? 'var(--semantic-warning)'
                      : 'var(--semantic-income)',
                  }}
                >
                  <Bell
                    className="w-4 h-4 shrink-0 mt-0.5"
                    style={{
                      color: incomingNotifBanner.isDuplicate
                        ? 'var(--semantic-warning)'
                        : 'var(--semantic-income)',
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold">
                      {incomingNotifBanner.appName} · NotificationListener
                    </div>
                    <div className="opacity-85 leading-snug">
                      {incomingNotifBanner.message}
                    </div>
                  </div>
                  <button
                    onClick={() => setIncomingNotifBanner(null)}
                    className="opacity-60 hover:opacity-100 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* 2. App Lock Screen Inside Phone */}
              {isPhoneLocked ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-5">
                  <KohiMascotIcon size={64} />
                  <div className="space-y-1">
                    <h2 className="text-lg font-extrabold">
                      {t('Kōhī ล็อกความปลอดภัย', 'Kōhī App Lock')}
                    </h2>
                    <p className="text-xs opacity-75">
                      {t(
                        'ฐานข้อมูลเข้ารหัส SQLCipher กรุณาใส่รหัส PIN (1234) หรือสแกนใบหน้า/ลายนิ้วมือ',
                        'Encrypted with SQLCipher. Enter PIN (1234) or use Biometrics.'
                      )}
                    </p>
                  </div>

                  <input
                    type="password"
                    maxLength={4}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="••••"
                    className="w-40 h-12 text-center text-xl tracking-widest rounded-2xl border font-mono-tabular"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-accent)',
                    }}
                  />
                  {pinError && (
                    <p
                      className="text-xs font-bold"
                      style={{ color: 'var(--semantic-error)' }}
                    >
                      {pinError}
                    </p>
                  )}

                  <div className="w-full space-y-2 pt-2">
                    <button
                      onClick={() => {
                        if (pinCode === '1234') {
                          setIsPhoneLocked(false);
                          setPinCode('');
                          setPinError(null);
                        } else {
                          setPinError(
                            t('รหัส PIN ไม่ถูกต้อง (ลอง 1234)', 'Invalid PIN (Try 1234)')
                          );
                        }
                      }}
                      className="w-full min-h-[44px] rounded-2xl text-xs font-bold cursor-pointer"
                      style={{
                        backgroundColor: 'var(--accent-primary)',
                        color: 'var(--accent-on-primary)',
                      }}
                    >
                      {t('ปลดล็อกด้วย PIN', 'Unlock with PIN')}
                    </button>
                    <button
                      onClick={() => {
                        setIsPhoneLocked(false);
                        setPinCode('');
                        setPinError(null);
                      }}
                      className="w-full min-h-[44px] rounded-2xl text-xs font-bold border cursor-pointer"
                      style={{ borderColor: 'var(--border-accent)' }}
                    >
                      {deviceOs === 'ios'
                        ? t('ปลดล็อกด้วย Face ID', 'Unlock with Face ID')
                        : t('สแกนลายนิ้วมือ (Biometric)', 'Fingerprint Unlock')}
                    </button>
                  </div>
                </div>
              ) : showOnboarding ? (
                /* 2B. Onboarding Flow (3 Screens inside mobile viewport) */
                <div className="flex-1 flex flex-col justify-between p-6 text-center">
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowOnboarding(false)}
                      className="text-xs font-bold opacity-70 cursor-pointer"
                    >
                      {t('ข้าม (Skip)', 'Skip')}
                    </button>
                  </div>

                  <div className="space-y-4 my-auto">
                    <div className="flex justify-center">
                      <KohiMascotIcon size={72} />
                    </div>
                    {onboardingStep === 0 && (
                      <>
                        <h2 className="text-lg font-extrabold">
                          {t(
                            'ยินดีต้อนรับสู่ Kōhī (จิบกาแฟ)',
                            'Welcome to Kōhī (จิบกาแฟ)'
                          )}
                        </h2>
                        <p className="text-xs opacity-80 leading-relaxed">
                          {t(
                            'แอปบันทึกรายรับ-รายจ่ายที่ออกแบบมาเพื่อธนาคารไทยโดยเฉพาะ ทำงานแบบ Offline-first เก็บข้อมูลไว้ในเครื่องของคุณด้วย SQLCipher',
                            'Offline-first personal finance tracker built for all 14 Thai banks and PromptPay. Encrypted on-device with SQLCipher.'
                          )}
                        </p>
                      </>
                    )}
                    {onboardingStep === 1 && (
                      <>
                        <h2 className="text-lg font-extrabold">
                          {t(
                            'อ่านสลิป & QR ในเครื่อง 100%',
                            '100% On-Device Slip OCR & QR'
                          )}
                        </h2>
                        <p className="text-xs opacity-80 leading-relaxed">
                          {t(
                            'เมื่อเปิดแอป Kōhī จะช่วยสแกนสลิปใหม่จากอัลบั้ม (เมื่อคุณอนุญาต) พร้อมบีบอัดรูป ≤1280px ลบพิกัด GPS/EXIF และตรวจจับรายการซ้ำอัตโนมัติ',
                            'Automatically scans new slips from your album upon permission, strips EXIF metadata, and prevents duplicate entries.'
                          )}
                        </p>
                      </>
                    )}
                    {onboardingStep === 2 && (
                      <>
                        <h2 className="text-lg font-extrabold">
                          {t(
                            'เลือกโหมดอ่านแจ้งเตือนธนาคาร (Android)',
                            'Android Bank Notification Access'
                          )}
                        </h2>
                        <p className="text-xs opacity-80 leading-relaxed">
                          {t(
                            'อ่านเฉพาะการแจ้งเตือนจาก 14 แอปธนาคารไทยในเครื่องเท่านั้น หากกด "อนุญาต" ระบบจะบันทึกให้อัตโนมัติและปิดการถามสแกนสลิปตอนเปิดแอป',
                            'Reads only allowlisted Thai bank notifications on-device. Allowing turns ON auto-listener and turns OFF app-open slip prompts.'
                          )}
                        </p>
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <button
                            onClick={() => {
                              setAndroidNotifEnabled(true);
                              setShowAppOpenSlipPrompt(false);
                              setShowOnboarding(false);
                            }}
                            className="min-h-[44px] rounded-xl text-xs font-bold cursor-pointer"
                            style={{
                              backgroundColor: 'var(--semantic-income)',
                              color: '#FFFCF7',
                            }}
                          >
                            {t('อนุญาต (Allow)', 'Allow')}
                          </button>
                          <button
                            onClick={() => {
                              setAndroidNotifEnabled(false);
                              setShowAppOpenSlipPrompt(true);
                              setShowOnboarding(false);
                            }}
                            className="min-h-[44px] rounded-xl text-xs font-bold border cursor-pointer"
                            style={{ borderColor: 'var(--border-accent)' }}
                          >
                            {t('ไว้ทีหลัง (Not now)', 'Not now')}
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-center gap-1.5">
                      {[0, 1, 2].map((idx) => (
                        <div
                          key={idx}
                          className="h-1.5 rounded-full transition-all"
                          style={{
                            width: onboardingStep === idx ? '24px' : '8px',
                            backgroundColor:
                              onboardingStep === idx
                                ? AppColors.caramel
                                : AppColors.latte,
                          }}
                        />
                      ))}
                    </div>
                    {onboardingStep < 2 && (
                      <button
                        onClick={() => setOnboardingStep((s) => s + 1)}
                        className="w-full min-h-[44px] rounded-2xl text-xs font-bold cursor-pointer"
                        style={{
                          backgroundColor: 'var(--accent-primary)',
                          color: 'var(--accent-on-primary)',
                        }}
                      >
                        {t('ถัดไป', 'Continue')}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* 3. Main Mobile App Header + Scrollable Screen Content */
                <>
                  {/* Mobile App Bar */}
                  <div
                    className="px-4 py-2.5 border-b flex items-center justify-between shrink-0"
                    style={{
                      backgroundColor: 'var(--bg-canvas)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <KohiMascotIcon size={28} />
                      <div>
                        <div
                          className="text-sm font-extrabold leading-tight"
                          style={{ color: 'var(--text-brand)' }}
                        >
                          Kōhī · จิบกาแฟ
                        </div>
                        <div className="text-[10px] opacity-70">
                          {deviceOs === 'ios' ? 'iOS · Impeller' : 'Android · SQLCipher'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setHideBalances(!hideBalances)}
                        className="min-h-[38px] min-w-[38px] rounded-xl flex items-center justify-center cursor-pointer"
                        style={{ backgroundColor: 'var(--bg-surface)' }}
                        aria-label="Hide balance"
                      >
                        {hideBalances ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => setIsPhoneLocked(true)}
                        className="min-h-[38px] min-w-[38px] rounded-xl flex items-center justify-center cursor-pointer"
                        style={{ backgroundColor: 'var(--bg-surface)' }}
                        aria-label="Lock app"
                      >
                        <Lock className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Mobile Viewport Body */}
                  <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-4">
                    {/* ── MOBILE TAB 1: HOME (Wallet, Today Summary & Feed) ── */}
                    {activeTab === 'home' && (
                      <div className="space-y-4">
                        {/* App-Open Photo Album Slip Prompt (if Android Notif is OFF) */}
                        {showAppOpenSlipPrompt && !androidNotifEnabled && (
                          <div
                            className="p-3 rounded-2xl border space-y-2"
                            style={{
                              backgroundColor: 'var(--bg-surface)',
                              borderColor: 'var(--border-accent)',
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 text-xs font-bold">
                                <Camera
                                  className="w-4 h-4 shrink-0"
                                  style={{ color: 'var(--accent-secondary)' }}
                                />
                                <span>
                                  {t(
                                    'พบสลิปโอนเงินใหม่ในอัลบั้ม (4 ใบ)',
                                    '4 new bank slips in Photo Album'
                                  )}
                                </span>
                              </div>
                              <button
                                onClick={() => setShowAppOpenSlipPrompt(false)}
                                className="opacity-60 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setActiveTab('scan')}
                                className="flex-1 min-h-[38px] rounded-xl text-xs font-bold cursor-pointer"
                                style={{
                                  backgroundColor: 'var(--accent-primary)',
                                  color: 'var(--accent-on-primary)',
                                }}
                              >
                                {t('สแกนสลิปจากอัลบั้ม', 'Scan Album Slips')}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Hero Balance Card */}
                        <div
                          className="p-4 rounded-3xl border space-y-3"
                          style={{
                            backgroundColor: 'var(--bg-surface)',
                            borderColor: 'var(--border-subtle)',
                          }}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="opacity-75 font-medium">
                              {t(
                                'คงเหลือสุทธิเดือนนี้',
                                'Monthly Net Cashflow'
                              )}
                            </span>
                            <span className="font-mono-tabular opacity-75">
                              {era === 'BE' ? 'ต.ค. 2569' : 'Oct 2026'}
                            </span>
                          </div>
                          <div className="text-2xl font-extrabold font-mono-tabular">
                            {summaryStats.net >= 0 ? '+' : '-'}
                            {formatTHB(Math.abs(summaryStats.net), {
                              hideBalance: hideBalances,
                            })}
                          </div>

                          <div
                            className="grid grid-cols-2 gap-2 pt-2.5 border-t"
                            style={{ borderColor: 'var(--border-subtle)' }}
                          >
                            <div>
                              <span className="text-[10px] opacity-75 block">
                                {t('รายรับรวม (+ ↗)', 'Income (+ ↗)')}
                              </span>
                              <span
                                className="text-sm font-extrabold font-mono-tabular flex items-center gap-0.5"
                                style={{ color: 'var(--semantic-income)' }}
                              >
                                {formatTHB(summaryStats.income, {
                                  hideBalance: hideBalances,
                                  showSign: 'income',
                                  decimals: 0,
                                })}
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] opacity-75 block">
                                {t('รายจ่ายรวม (- ↘)', 'Expense (- ↘)')}
                              </span>
                              <span
                                className="text-sm font-extrabold font-mono-tabular flex items-center gap-0.5"
                                style={{ color: 'var(--semantic-expense)' }}
                              >
                                {formatTHB(summaryStats.expense, {
                                  hideBalance: hideBalances,
                                  showSign: 'expense',
                                  decimals: 0,
                                })}
                                <ArrowDownRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Horizontal Thai Bank Accounts Carousel */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold">
                              {t(
                                'บัญชีธนาคารและวอลเล็ท (14 แห่ง)',
                                'Thai Banks & Wallets (14)'
                              )}
                            </span>
                            <button
                              onClick={() => setIsQuickAddSheetOpen(true)}
                              className="font-bold underline cursor-pointer"
                              style={{ color: 'var(--accent-secondary)' }}
                            >
                              {t('+ จดรายการด่วน', '+ Quick Entry')}
                            </button>
                          </div>
                          <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                            {accounts.slice(0, 8).map((acc) => (
                              <div
                                key={acc.id}
                                className="min-w-[135px] p-3 rounded-2xl border shrink-0 space-y-1"
                                style={{
                                  backgroundColor: 'var(--bg-surface)',
                                  borderColor: 'var(--border-subtle)',
                                }}
                              >
                                <div className="text-[11px] font-bold truncate">
                                  {acc.bankCode}
                                </div>
                                <div className="text-xs font-extrabold font-mono-tabular">
                                  {formatTHB(accountBalances[acc.id] || 0, {
                                    hideBalance: hideBalances,
                                    decimals: 0,
                                  })}
                                </div>
                                <div className="text-[10px] opacity-65 font-mono-tabular truncate">
                                  {acc.accountNumberMasked}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Undo Delete Banner */}
                        {deletedTxUndo && (
                          <div
                            className="p-2.5 rounded-xl border flex items-center justify-between text-xs"
                            style={{
                              backgroundColor: 'var(--bg-surface)',
                              borderColor: 'var(--semantic-warning)',
                            }}
                          >
                            <span className="truncate">
                              {t('ลบรายการแล้ว', 'Deleted entry')}
                            </span>
                            <button
                              onClick={() => {
                                setTransactions((prev) => [
                                  deletedTxUndo,
                                  ...prev,
                                ]);
                                setDeletedTxUndo(null);
                              }}
                              className="font-bold underline flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              <Undo2 className="w-3.5 h-3.5" />
                              Undo
                            </button>
                          </div>
                        )}

                        {/* Search & Filter Strip */}
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-3 opacity-60" />
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder={t(
                                'ค้นหารายการ, รหัสอ้างอิง...',
                                'Search notes, ref...'
                              )}
                              className="w-full h-9 pl-8 pr-2.5 rounded-xl border text-xs"
                              style={{
                                backgroundColor: 'var(--bg-surface)',
                                borderColor: 'var(--border-subtle)',
                              }}
                            />
                          </div>
                          <div
                            className="flex items-center p-0.5 rounded-xl border text-[11px] font-bold"
                            style={{
                              backgroundColor: 'var(--bg-surface)',
                              borderColor: 'var(--border-subtle)',
                            }}
                          >
                            {(['all', 'income', 'expense'] as const).map((k) => (
                              <button
                                key={k}
                                onClick={() => setFilterType(k)}
                                className="px-2 py-1 rounded-lg cursor-pointer"
                                style={
                                  filterType === k
                                    ? {
                                        backgroundColor: 'var(--accent-primary)',
                                        color: 'var(--accent-on-primary)',
                                      }
                                    : {}
                                }
                              >
                                {k === 'all'
                                  ? t('ทั้งหมด', 'All')
                                  : k === 'income'
                                  ? '+รับ'
                                  : '-จ่าย'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Mobile Transaction List */}
                        <div
                          className="divide-y"
                          style={{ borderColor: 'var(--border-subtle)' }}
                        >
                          {filteredTransactions.map((tx) => {
                            const cat = categories.find(
                              (c) => c.id === tx.categoryId
                            );
                            const acc = accounts.find(
                              (a) => a.id === tx.accountId
                            );
                            const isInc = tx.type === 'income';
                            return (
                              <div
                                key={tx.id}
                                className="py-3 flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0">
                                  <div className="text-xs font-bold truncate">
                                    {tx.note}
                                  </div>
                                  <div className="text-[11px] opacity-75 truncate">
                                    {cat
                                      ? locale === 'th'
                                        ? cat.nameTh
                                        : cat.nameEn
                                      : ''}{' '}
                                    · {acc?.bankCode} ·{' '}
                                    {formatThaiDateShort(
                                      tx.timestamp,
                                      locale,
                                      era
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span
                                    className="text-xs font-extrabold font-mono-tabular"
                                    style={{
                                      color: isInc
                                        ? 'var(--semantic-income)'
                                        : 'var(--semantic-expense)',
                                    }}
                                  >
                                    {formatTHB(tx.amount, {
                                      hideBalance: hideBalances,
                                      showSign: tx.type,
                                      decimals: 0,
                                    })}{' '}
                                    {isInc ? '↗' : '↘'}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setDeletedTxUndo(tx);
                                      setTransactions((prev) =>
                                        prev.filter((i) => i.id !== tx.id)
                                      );
                                    }}
                                    className="p-1.5 opacity-50 hover:opacity-100 cursor-pointer"
                                    aria-label="Delete"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ── MOBILE TAB 2: MONTHLY B.E. CALENDAR & CHARTS ──────── */}
                    {activeTab === 'calendar' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-extrabold">
                            {formatMonthHeader(calYear, calMonth, locale, era)}
                          </h3>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                setCalMonth((m) => (m === 0 ? 11 : m - 1))
                              }
                              className="p-1.5 rounded-lg border cursor-pointer"
                              style={{
                                backgroundColor: 'var(--bg-surface)',
                                borderColor: 'var(--border-subtle)',
                              }}
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                setCalMonth((m) => (m === 11 ? 0 : m + 1))
                              }
                              className="p-1.5 rounded-lg border cursor-pointer"
                              style={{
                                backgroundColor: 'var(--bg-surface)',
                                borderColor: 'var(--border-subtle)',
                              }}
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Compact Mobile Calendar Grid */}
                        <div>
                          <div className="grid grid-cols-7 text-center text-[10px] font-bold opacity-70 mb-1">
                            {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((d) => (
                              <div key={d}>{d}</div>
                            ))}
                          </div>
                          <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: firstDayWeekday }).map(
                              (_, i) => (
                                <div key={`e_${i}`} className="h-12" />
                              )
                            )}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                              const day = i + 1;
                              const info = dailyCalendarMap[day];
                              const isToday = day === 20 && calMonth === 9;
                              const isSelected = selectedCalDay === day;
                              return (
                                <button
                                  key={day}
                                  onClick={() => setSelectedCalDay(day)}
                                  className="h-13 p-1 rounded-xl border flex flex-col justify-between text-left cursor-pointer overflow-hidden"
                                  style={{
                                    backgroundColor: 'var(--bg-surface)',
                                    borderColor:
                                      isToday || isSelected
                                        ? AppColors.caramel
                                        : 'var(--border-subtle)',
                                    borderWidth:
                                      isToday || isSelected ? '2px' : '1px',
                                  }}
                                >
                                  <span
                                    className="text-[10px] font-bold font-mono-tabular w-4 h-4 rounded flex items-center justify-center"
                                    style={
                                      isToday
                                        ? {
                                            backgroundColor: AppColors.caramel,
                                            color: AppColors.warmWhite,
                                          }
                                        : {}
                                    }
                                  >
                                    {day}
                                  </span>
                                  <div className="w-full space-y-0.5">
                                    {info && info.income > 0 && (
                                      <div
                                        className="text-[8px] font-mono-tabular font-bold truncate"
                                        style={{
                                          color: 'var(--semantic-income)',
                                        }}
                                      >
                                        +{info.income}
                                      </div>
                                    )}
                                    {info && info.expense > 0 && (
                                      <div
                                        className="text-[8px] font-mono-tabular font-bold truncate"
                                        style={{
                                          color: 'var(--semantic-expense)',
                                        }}
                                      >
                                        -{info.expense}
                                      </div>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Selected Day Transactions */}
                        <div
                          className="p-3.5 rounded-2xl border space-y-2"
                          style={{
                            backgroundColor: 'var(--bg-surface)',
                            borderColor: 'var(--border-subtle)',
                          }}
                        >
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span>
                              {t(
                                `รายการวันที่ ${selectedCalDay} ต.ค.`,
                                `Oct ${selectedCalDay} Entries`
                              )}
                            </span>
                            <span className="font-mono-tabular opacity-75">
                              {selectedDayDetails.items.length}{' '}
                              {t('รายการ', 'items')}
                            </span>
                          </div>
                          {selectedDayDetails.items.length === 0 ? (
                            <p className="text-[11px] opacity-70">
                              {t('ไม่มีรายการในวันนี้', 'No transactions on this day')}
                            </p>
                          ) : (
                            selectedDayDetails.items.map((tx) => (
                              <div
                                key={tx.id}
                                className="flex items-center justify-between text-xs pt-1.5 border-t"
                                style={{ borderColor: 'var(--border-subtle)' }}
                              >
                                <span className="truncate max-w-[180px]">
                                  {tx.note}
                                </span>
                                <span
                                  className="font-mono-tabular font-bold"
                                  style={{
                                    color:
                                      tx.type === 'income'
                                        ? 'var(--semantic-income)'
                                        : 'var(--semantic-expense)',
                                  }}
                                >
                                  {formatTHB(tx.amount, {
                                    showSign: tx.type,
                                    decimals: 0,
                                  })}
                                </span>
                              </div>
                            ))
                          )}
                        </div>

                        {/* 8-Color Category Breakdown */}
                        <div
                          className="p-3.5 rounded-2xl border space-y-2.5"
                          style={{
                            backgroundColor: 'var(--bg-surface)',
                            borderColor: 'var(--border-subtle)',
                          }}
                        >
                          <div className="text-xs font-bold">
                            {t(
                              'สัดส่วนรายจ่ายตามหมวดหมู่ (8 สีหลัก)',
                              'Expenses by Category (8-Color Palette)'
                            )}
                          </div>
                          <div className="h-3.5 w-full rounded-full overflow-hidden flex">
                            {categoryChartSlices.map((s) => (
                              <div
                                key={s.catId}
                                style={{
                                  width: `${Math.max(s.pct, 4)}%`,
                                  backgroundColor: s.color,
                                }}
                              />
                            ))}
                          </div>
                          <div className="space-y-1.5 text-xs">
                            {categoryChartSlices.map((s) => (
                              <div
                                key={s.catId}
                                className="flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span
                                    className="w-2.5 h-2.5 rounded-xs shrink-0"
                                    style={{ backgroundColor: s.color }}
                                  />
                                  <span className="truncate">{s.name}</span>
                                </div>
                                <span className="font-mono-tabular font-bold">
                                  {formatTHB(s.amount, {
                                    hideBalance: hideBalances,
                                    decimals: 0,
                                  })}{' '}
                                  ({s.pct.toFixed(0)}%)
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── MOBILE TAB 3: SLIP OCR & PROMPTPAY QR SCANNER ─────── */}
                    {activeTab === 'scan' && (
                      <div className="space-y-3.5">
                        <div className="flex items-center p-1 rounded-xl border text-xs font-bold" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                          <button
                            onClick={() => {
                              setScanSubMode('album');
                              setActiveSlipDraft(null);
                            }}
                            className="flex-1 py-2 rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
                            style={
                              scanSubMode === 'album'
                                ? {
                                    backgroundColor: 'var(--accent-primary)',
                                    color: 'var(--accent-on-primary)',
                                  }
                                : {}
                            }
                          >
                            <FileImage className="w-3.5 h-3.5" />
                            {t('อัลบั้มสลิป', 'Photo Album')}
                          </button>
                          <button
                            onClick={() => {
                              setScanSubMode('qr');
                              setActiveSlipDraft(null);
                            }}
                            className="flex-1 py-2 rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
                            style={
                              scanSubMode === 'qr'
                                ? {
                                    backgroundColor: 'var(--accent-primary)',
                                    color: 'var(--accent-on-primary)',
                                  }
                                : {}
                            }
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            PromptPay QR
                          </button>
                        </div>

                        {!activeSlipDraft && scanSubMode === 'album' && (
                          <div className="space-y-3">
                            {!albumPermissionGranted ? (
                              <div
                                className="p-4 rounded-2xl border space-y-3"
                                style={{
                                  backgroundColor: 'var(--bg-surface)',
                                  borderColor: 'var(--border-accent)',
                                }}
                              >
                                <div className="text-xs font-bold flex items-center gap-1.5">
                                  <ShieldCheck
                                    className="w-4 h-4"
                                    style={{ color: 'var(--semantic-income)' }}
                                  />
                                  {t(
                                    'ขออนุญาตเข้าถึงโฟลเดอร์รูปสลิปในอัลบั้มอัตโนมัติ',
                                    'Allow Auto-Read from Bank Slip Album Folder'
                                  )}
                                </div>
                                <p className="text-[11px] opacity-80 leading-relaxed">
                                  {t(
                                    'เมื่อคุณกดอนุญาต แอปจะเข้าไปอ่านรูปสลิปใหม่ในโฟลเดอร์อัลบั้มให้อัตโนมัติทุกครั้งที่เปิดแอป (ไม่ต้องกดอัปโหลดทีละรูป) ประมวลผล OCR ภาษาไทยและ QR ในเครื่อง 100%',
                                    'Once permitted, Kōhī automatically reads new slip images from your album folder on app open (100% on-device).'
                                  )}
                                </p>
                                <button
                                  onClick={() => setAlbumPermissionGranted(true)}
                                  className="w-full min-h-[42px] rounded-xl text-xs font-bold cursor-pointer"
                                  style={{
                                    backgroundColor: 'var(--accent-primary)',
                                    color: 'var(--accent-on-primary)',
                                  }}
                                >
                                  {t(
                                    'อนุญาตให้อ่านโฟลเดอร์สลิปอัตโนมัติ (Allow)',
                                    'Allow Automatic Folder Scanning'
                                  )}
                                </button>
                              </div>
                            ) : (
                              <>
                                <div
                                  className="p-3 rounded-2xl border space-y-1.5"
                                  style={{
                                    backgroundColor: 'var(--bg-surface)',
                                    borderColor: 'var(--border-accent)',
                                  }}
                                >
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="font-bold flex items-center gap-1.5">
                                      <CheckCircle2
                                        className="w-3.5 h-3.5"
                                        style={{ color: 'var(--semantic-income)' }}
                                      />
                                      {t(
                                        'อ่านโฟลเดอร์สลิปอัตโนมัติ: เปิดอยู่',
                                        'Auto-Read Slip Folder: Active'
                                      )}
                                    </span>
                                    <button
                                      onClick={() => setAlbumPermissionGranted(false)}
                                      className="underline opacity-75 cursor-pointer"
                                    >
                                      {t('ตั้งค่าสิทธิ์', 'Permissions')}
                                    </button>
                                  </div>
                                  <p className="text-[11px] opacity-80 leading-snug">
                                    {t(
                                      'แอปจะเข้าไปอ่านรูปสลิปใหม่ในโฟลเดอร์ธนาคารของเครื่องเองอัตโนมัติเมื่อเปิดแอป โดยไม่ต้องอัปโหลดเอง',
                                      'Automatically scans your bank slip album folder on app launch without manual uploads.'
                                    )}
                                  </p>
                                </div>

                                <div className="text-xs font-bold pt-1">
                                  {t(
                                    'รูปสลิปที่ระบบตรวจพบในโฟลเดอร์อัลบั้มอัตโนมัติ (แตะเพื่อดูผล OCR):',
                                    'Slips auto-detected in album folder (Tap to inspect):'
                                  )}
                                </div>
                                <div className="space-y-2">
                                  {PRELOADED_ALBUM_SLIPS.map((s) => (
                                    <button
                                      key={s.id}
                                      onClick={() => handleSelectSampleSlip(s)}
                                      className="w-full text-left p-3 rounded-2xl border space-y-1 cursor-pointer"
                                      style={{
                                        backgroundColor: 'var(--bg-surface)',
                                        borderColor: 'var(--border-subtle)',
                                      }}
                                    >
                                      <div className="flex items-center justify-between text-[11px] opacity-75">
                                        <span>{s.bankCode} · Auto-detected</span>
                                        <span className="font-mono-tabular font-bold">
                                          {formatTHB(s.amount)}
                                        </span>
                                      </div>
                                      <div className="text-xs font-bold">
                                        {locale === 'th' ? s.titleTh : s.titleEn}
                                      </div>
                                    </button>
                                  ))}
                                </div>

                                {/* Simulate adding a slip file into the watched folder for browser testing */}
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept="image/*"
                                  onChange={handleRealSlipFileUpload}
                                  className="hidden"
                                />
                                <button
                                  onClick={() => fileInputRef.current?.click()}
                                  className="w-full min-h-[42px] px-3 py-2 rounded-2xl border border-dashed flex items-center justify-center gap-2 text-[11px] font-bold cursor-pointer"
                                  style={{
                                    backgroundColor: 'var(--bg-surface)',
                                    borderColor: 'var(--border-accent)',
                                  }}
                                >
                                  <FolderTree className="w-3.5 h-3.5 shrink-0" />
                                  <span>
                                    {isParsingSlip
                                      ? t('กำลังอ่านสลิปจากโฟลเดอร์...', 'Scanning folder...')
                                      : t(
                                          'จำลองมีรูปสลิปใหม่เพิ่มเข้าโฟลเดอร์เครื่อง (สำหรับทดสอบบนเว็บ)',
                                          'Simulate New Slip Saved in Device Folder (Web Test)'
                                        )}
                                  </span>
                                </button>
                              </>
                            )}
                          </div>
                        )}

                        {!activeSlipDraft && scanSubMode === 'qr' && (
                          <div
                            className="p-3.5 rounded-2xl border space-y-3"
                            style={{
                              backgroundColor: 'var(--bg-surface)',
                              borderColor: 'var(--border-subtle)',
                            }}
                          >
                            <div className="text-xs font-bold">
                              {t(
                                'สแกน EMVCo PromptPay QR (TLV + CRC16)',
                                'EMVCo PromptPay TLV + CRC16'
                              )}
                            </div>
                            <textarea
                              rows={3}
                              value={customQrPayload}
                              onChange={(e) => setCustomQrPayload(e.target.value)}
                              className="w-full p-2.5 rounded-xl border font-mono-tabular text-[11px]"
                              style={{
                                backgroundColor: 'var(--bg-canvas)',
                                borderColor: 'var(--border-subtle)',
                              }}
                            />
                            <button
                              onClick={() => {
                                const res = parseThaiPromptPayQr(customQrPayload);
                                const amt = res.amount || 85;
                                const parsed = parseThaiSlipOcrText(
                                  `พร้อมเพย์ PromptPay\nจำนวน: ${amt} บาท\nไปยัง: PromptPay ${res.promptPayId || 'Merchant'}`,
                                  rules,
                                  categories,
                                  transactions,
                                  customQrPayload
                                );
                                setActiveSlipDraft({
                                  ...parsed,
                                  source: 'qr_scan',
                                  crcValid: res.crcValid,
                                });
                              }}
                              className="w-full min-h-[42px] rounded-xl text-xs font-bold cursor-pointer"
                              style={{
                                backgroundColor: 'var(--accent-primary)',
                                color: 'var(--accent-on-primary)',
                              }}
                            >
                              {t('ถอดรหัส QR เดี๋ยวนี้', 'Decode PromptPay QR')}
                            </button>
                          </div>
                        )}

                        {/* Editable Confirmation Card inside Phone */}
                        {activeSlipDraft && (
                          <div
                            className="p-3.5 rounded-2xl border space-y-3"
                            style={{
                              backgroundColor: 'var(--bg-surface)',
                              borderColor: 'var(--border-accent)',
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold">
                                {t(
                                  'ตรวจสอบข้อมูลสลิปก่อนบันทึก',
                                  'Confirm Extracted Slip Fields'
                                )}
                              </span>
                              <button
                                onClick={() => setActiveSlipDraft(null)}
                                className="text-xs underline cursor-pointer"
                              >
                                {t('เปลี่ยนใบ', 'Back')}
                              </button>
                            </div>

                            {activeSlipDraft.duplicateOfId && (
                              <div
                                className="p-2.5 rounded-xl border text-[11px] flex items-start gap-2"
                                style={{
                                  backgroundColor: 'var(--bg-canvas)',
                                  borderColor: 'var(--semantic-warning)',
                                }}
                              >
                                <AlertTriangle
                                  className="w-4 h-4 shrink-0 mt-0.5"
                                  style={{ color: 'var(--semantic-warning)' }}
                                />
                                <span>
                                  {t(
                                    `ตรวจพบรายการซ้ำ! ตรงกับรายการเดิม (฿${activeSlipDraft.amount} · Ref: ${activeSlipDraft.referenceNo})`,
                                    `Duplicate detected! Matches Ref ${activeSlipDraft.referenceNo}.`
                                  )}
                                </span>
                              </div>
                            )}

                            {activeSlipDraft.slipImage && (
                              <div className="text-[11px] flex items-center gap-1.5 opacity-85">
                                <CheckCircle2
                                  className="w-3.5 h-3.5"
                                  style={{ color: 'var(--semantic-income)' }}
                                />
                                <span>
                                  WebP ≤1280px · EXIF Stripped:{' '}
                                  <strong className="font-mono-tabular">
                                    {formatBytes(
                                      activeSlipDraft.slipImage.originalSizeBytes
                                    )}{' '}
                                    →{' '}
                                    {formatBytes(
                                      activeSlipDraft.slipImage
                                        .compressedSizeBytes
                                    )}
                                  </strong>
                                </span>
                              </div>
                            )}

                            <div className="space-y-2 text-xs">
                              <div>
                                <label className="text-[11px] font-bold block">
                                  {t('จำนวนเงิน (฿)', 'Amount (฿)')}
                                </label>
                                <input
                                  type="number"
                                  value={activeSlipDraft.amount}
                                  onChange={(e) =>
                                    setActiveSlipDraft({
                                      ...activeSlipDraft,
                                      amount: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  className="w-full h-9 px-2.5 rounded-xl border font-mono-tabular font-bold"
                                  style={{
                                    backgroundColor: 'var(--bg-canvas)',
                                    borderColor: 'var(--border-subtle)',
                                  }}
                                />
                              </div>

                              <div>
                                <label className="text-[11px] font-bold block">
                                  {t('หมวดหมู่ (จัดหมวดอัตโนมัติ)', 'Category')}
                                </label>
                                <select
                                  value={activeSlipDraft.categoryId}
                                  onChange={(e) =>
                                    setActiveSlipDraft({
                                      ...activeSlipDraft,
                                      categoryId: e.target.value,
                                    })
                                  }
                                  className="w-full h-9 px-2.5 rounded-xl border"
                                  style={{
                                    backgroundColor: 'var(--bg-canvas)',
                                    borderColor: 'var(--border-subtle)',
                                  }}
                                >
                                  {categories
                                    .filter(
                                      (c) => c.type === activeSlipDraft.type
                                    )
                                    .map((cat) => (
                                      <option key={cat.id} value={cat.id}>
                                        {locale === 'th'
                                          ? cat.nameTh
                                          : cat.nameEn}
                                      </option>
                                    ))}
                                </select>
                              </div>

                              <div>
                                <label className="text-[11px] font-bold block">
                                  {t('ผู้รับโอน / ร้านค้า', 'Receiver / Merchant')}
                                </label>
                                <input
                                  type="text"
                                  value={activeSlipDraft.receiverName}
                                  onChange={(e) =>
                                    setActiveSlipDraft({
                                      ...activeSlipDraft,
                                      receiverName: e.target.value,
                                    })
                                  }
                                  className="w-full h-9 px-2.5 rounded-xl border"
                                  style={{
                                    backgroundColor: 'var(--bg-canvas)',
                                    borderColor: 'var(--border-subtle)',
                                  }}
                                />
                              </div>
                            </div>

                            <label className="flex items-center gap-2 text-[11px] cursor-pointer">
                              <input
                                type="checkbox"
                                checked={learnMerchantRule}
                                onChange={(e) =>
                                  setLearnMerchantRule(e.target.checked)
                                }
                              />
                              <span>
                                {t(
                                  'จดจำร้านค้านี้ไว้จัดหมวดอัตโนมัติครั้งถัดไป',
                                  'Learn merchant for auto-categorization'
                                )}
                              </span>
                            </label>

                            <button
                              onClick={handleConfirmSlipDraft}
                              className="w-full min-h-[42px] rounded-xl text-xs font-bold cursor-pointer"
                              style={{
                                backgroundColor: 'var(--accent-primary)',
                                color: 'var(--accent-on-primary)',
                              }}
                            >
                              {t('ยืนยันบันทึกรายการ', 'Confirm & Save')}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── MOBILE TAB 4: ANDROID NOTIFICATION & iOS SHORTCUTS ── */}
                    {activeTab === 'automation' && (
                      <div className="space-y-3.5">
                        <div
                          className="p-3.5 rounded-2xl border space-y-2.5"
                          style={{
                            backgroundColor: 'var(--bg-surface)',
                            borderColor: 'var(--border-accent)',
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold flex items-center gap-1.5">
                              <Shield
                                className="w-4 h-4"
                                style={{ color: 'var(--semantic-income)' }}
                              />
                              {t(
                                'อ่านแจ้งเตือนธนาคาร (Android)',
                                'Android Notification Listener'
                              )}
                            </span>
                            <button
                              onClick={() => {
                                const next = !androidNotifEnabled;
                                setAndroidNotifEnabled(next);
                                if (next) setShowAppOpenSlipPrompt(false);
                              }}
                              className="px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer"
                              style={{
                                backgroundColor: androidNotifEnabled
                                  ? 'var(--semantic-income)'
                                  : 'var(--accent-primary)',
                                color: '#FFFCF7',
                              }}
                            >
                              {androidNotifEnabled ? 'ON (Allow)' : 'OFF'}
                            </button>
                          </div>
                          <p className="text-[11px] opacity-80 leading-relaxed">
                            {t(
                              'อ่านเฉพาะ 14 แอปธนาคารไทยในเครื่อง เมื่อเปิด ON ระบบจะปิดโหมดถามสแกนสลิปตอนเปิดแอปอัตโนมัติ',
                              'Strictly allowlisted to 14 Thai banks on-device. Turning ON disables app-open slip scan prompt.'
                            )}
                          </p>
                        </div>

                        <div className="text-xs font-bold">
                          {t(
                            'แตะเพื่อยิงแจ้งเตือนธนาคารเข้ามือถือเครื่องนี้:',
                            'Tap to fire a pre-loaded bank notification:'
                          )}
                        </div>
                        <div className="space-y-2">
                          {PRELOADED_NOTIFICATIONS.map((n) => (
                            <div
                              key={n.id}
                              className="p-3 rounded-2xl border space-y-1.5"
                              style={{
                                backgroundColor: 'var(--bg-surface)',
                                borderColor: 'var(--border-subtle)',
                              }}
                            >
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold">{n.appName}</span>
                                <span className="font-mono-tabular font-bold">
                                  {formatTHB(n.expectedAmount, {
                                    showSign: n.expectedType,
                                  })}
                                </span>
                              </div>
                              <p className="text-[11px] opacity-80 leading-snug">
                                {locale === 'th' ? n.bodyTh : n.bodyEn}
                              </p>
                              <button
                                onClick={() => handleSimulateBankNotification(n)}
                                className="w-full min-h-[36px] rounded-xl text-[11px] font-bold cursor-pointer"
                                style={{
                                  backgroundColor: 'var(--accent-primary)',
                                  color: 'var(--accent-on-primary)',
                                }}
                              >
                                {t('จำลองแจ้งเตือนเด้งเข้าเครื่อง', 'Simulate Push Notification')}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── MOBILE TAB 5: SETTINGS, PAYWALL & FAMILY SHARING ──── */}
                    {activeTab === 'settings' && (
                      <div className="space-y-3.5">
                        {/* Sub-navigation pills inside Settings */}
                        <div className="flex items-center gap-1 p-1 rounded-xl border text-[11px] font-bold" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                          {(
                            [
                              ['main', t('ตั้งค่า', 'General')],
                              ['paywall', t('แพ็กเกจ', 'Plans')],
                              ['family', t('ครอบครัว', 'Family')],
                              ['storage', t('รูปสลิป', 'Storage')],
                            ] as const
                          ).map(([key, label]) => (
                            <button
                              key={key}
                              onClick={() => setSettingsSubView(key)}
                              className="flex-1 py-1.5 rounded-lg cursor-pointer"
                              style={
                                settingsSubView === key
                                  ? {
                                      backgroundColor: 'var(--accent-primary)',
                                      color: 'var(--accent-on-primary)',
                                    }
                                  : {}
                              }
                            >
                              {label}
                            </button>
                          ))}
                        </div>

                        {settingsSubView === 'main' && (
                          <div className="space-y-2.5 text-xs">
                            <div
                              className="p-3.5 rounded-2xl border space-y-2.5"
                              style={{
                                backgroundColor: 'var(--bg-surface)',
                                borderColor: 'var(--border-subtle)',
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold">
                                  {t('รูปแบบปีปฏิทิน', 'Calendar Era')}
                                </span>
                                <button
                                  onClick={() =>
                                    setEra(era === 'BE' ? 'CE' : 'BE')
                                  }
                                  className="px-2.5 py-1 rounded-lg border font-mono-tabular font-bold cursor-pointer"
                                  style={{
                                    backgroundColor: 'var(--bg-canvas)',
                                    borderColor: 'var(--border-subtle)',
                                  }}
                                >
                                  {era === 'BE' ? 'พ.ศ. 2569' : 'ค.ศ. 2026'}
                                </button>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="font-bold">
                                  {t('หน้าแนะนำการใช้งาน (Onboarding)', 'Onboarding Guide')}
                                </span>
                                <button
                                  onClick={() => {
                                    setOnboardingStep(0);
                                    setShowOnboarding(true);
                                  }}
                                  className="px-2.5 py-1 rounded-lg border font-bold cursor-pointer"
                                  style={{
                                    backgroundColor: 'var(--bg-canvas)',
                                    borderColor: 'var(--border-subtle)',
                                  }}
                                >
                                  {t('เปิดดู', 'Replay')}
                                </button>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="font-bold">
                                  {t('ส่งออกข้อมูลทั้งหมด (CSV)', 'Export CSV (PDPA)')}
                                </span>
                                <button
                                  onClick={handleExportCsv}
                                  className="px-2.5 py-1 rounded-lg border font-bold cursor-pointer"
                                  style={{
                                    backgroundColor: 'var(--bg-canvas)',
                                    borderColor: 'var(--border-subtle)',
                                  }}
                                >
                                  Export CSV
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {settingsSubView === 'paywall' && (
                          <div className="space-y-2.5 text-xs">
                            {/* Free */}
                            <div
                              className="p-3.5 rounded-2xl border space-y-1.5"
                              style={{
                                backgroundColor: 'var(--bg-surface)',
                                borderColor:
                                  currentPlan === 'free'
                                    ? 'var(--border-accent)'
                                    : 'var(--border-subtle)',
                              }}
                            >
                              <div className="flex items-center justify-between font-bold">
                                <span>Kōhī Free (Offline-First)</span>
                                <span className="font-mono-tabular">฿0</span>
                              </div>
                              <p className="text-[11px] opacity-80">
                                {t(
                                  'ใช้งานออฟไลน์ครบทุกฟีเจอร์ สแกนสลิป OCR/QR ไม่ต้องสมัครสมาชิก',
                                  'Full offline tracking, Slip OCR/QR, no account required.'
                                )}
                              </p>
                            </div>

                            {/* Pro */}
                            <div
                              className="p-3.5 rounded-2xl border-2 space-y-2"
                              style={{
                                backgroundColor: 'var(--bg-surface)',
                                borderColor: 'var(--border-accent)',
                              }}
                            >
                              <div className="flex items-center justify-between font-bold">
                                <span className="flex items-center gap-1">
                                  <Crown className="w-3.5 h-3.5" />
                                  Kōhī Pro (Family & Cloud)
                                </span>
                                <span className="font-mono-tabular">฿79/ด.</span>
                              </div>
                              <p className="text-[11px] opacity-80">
                                {t(
                                  'แชร์ข้อมูลกับครอบครัว ตั้งชื่อเล่น และสำรองข้อมูลเข้ารหัส E2EE',
                                  'Family sharing with nicknames + encrypted Cloud backup.'
                                )}
                              </p>
                              <button
                                onClick={() => setCurrentPlan('pro')}
                                className="w-full min-h-[38px] rounded-xl font-bold cursor-pointer"
                                style={{
                                  backgroundColor: 'var(--accent-primary)',
                                  color: 'var(--accent-on-primary)',
                                }}
                              >
                                {currentPlan === 'pro'
                                  ? t('ใช้งาน Pro อยู่ ✓', 'Active: Pro ✓')
                                  : t('อัปเกรดเป็น Pro (฿79)', 'Upgrade to Pro')}
                              </button>
                            </div>

                            {/* Premium Coming Soon */}
                            <div
                              className="p-3.5 rounded-2xl border space-y-2"
                              style={{
                                backgroundColor: 'var(--bg-canvas)',
                                borderColor: 'var(--border-subtle)',
                              }}
                            >
                              <div className="flex items-center justify-between font-bold">
                                <span>Kōhī Premium (Coming Soon)</span>
                                <span className="font-mono-tabular">฿149/ด.</span>
                              </div>
                              <p className="text-[11px] opacity-75">
                                {t(
                                  'เร็วๆ นี้: ระบบช่วยคำนวณลดหย่อนภาษีไทยและพอร์ตลงทุน',
                                  'Teaser: Thai Tax Allowance & Wealth Portfolio.'
                                )}
                              </p>
                              <button
                                onClick={() => setNotifyPremium(!notifyPremium)}
                                className="w-full min-h-[36px] rounded-xl border font-bold cursor-pointer"
                                style={{ borderColor: 'var(--border-accent)' }}
                              >
                                {notifyPremium
                                  ? t('แจ้งเตือนเมื่อเปิดตัวแล้ว ✓', 'Subscribed ✓')
                                  : t('แจ้งเตือนฉัน (Notify Me)', 'Notify Me')}
                              </button>
                            </div>
                          </div>
                        )}

                        {settingsSubView === 'family' && (
                          <div
                            className="p-3.5 rounded-2xl border space-y-3 text-xs"
                            style={{
                              backgroundColor: 'var(--bg-surface)',
                              borderColor: 'var(--border-subtle)',
                            }}
                          >
                            <div className="font-bold flex items-center gap-1.5">
                              <Users className="w-4 h-4" />
                              {t('สมาชิกครอบครัว (Pro Family)', 'Family Members')}
                            </div>
                            {familyMembers.map((m) => (
                              <div
                                key={m.id}
                                className="py-2 border-t flex items-center justify-between"
                                style={{ borderColor: 'var(--border-subtle)' }}
                              >
                                <div>
                                  <div className="font-bold">{m.nickname}</div>
                                  <div className="text-[10px] opacity-70">
                                    {m.email}
                                  </div>
                                </div>
                                <span className="text-[10px] font-mono-tabular">
                                  {m.shareExpense ? 'แชร์รายจ่าย ✓' : 'ส่วนตัว'}
                                </span>
                              </div>
                            ))}
                            <div className="flex gap-1.5 pt-1">
                              <input
                                type="text"
                                placeholder={t('ชื่อเล่น', 'Nickname')}
                                value={newMemberName}
                                onChange={(e) =>
                                  setNewMemberName(e.target.value)
                                }
                                className="flex-1 h-8 px-2 rounded-lg border text-[11px]"
                                style={{
                                  backgroundColor: 'var(--bg-canvas)',
                                  borderColor: 'var(--border-subtle)',
                                }}
                              />
                              <button
                                onClick={() => {
                                  if (!newMemberName.trim()) return;
                                  setFamilyMembers((prev) => [
                                    ...prev,
                                    {
                                      id: `f_${Date.now()}`,
                                      nickname: newMemberName,
                                      email:
                                        newMemberEmail || 'member@kohi.app',
                                      role: 'member',
                                      shareIncome: false,
                                      shareExpense: true,
                                      monthlyIncomeShared: 0,
                                      monthlyExpenseShared: 0,
                                      lastSyncedAt: new Date().toISOString(),
                                    },
                                  ]);
                                  setNewMemberName('');
                                  setNewMemberEmail('');
                                }}
                                className="px-3 h-8 rounded-lg font-bold cursor-pointer"
                                style={{
                                  backgroundColor: 'var(--accent-primary)',
                                  color: 'var(--accent-on-primary)',
                                }}
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}

                        {settingsSubView === 'storage' && (
                          <div
                            className="p-3.5 rounded-2xl border space-y-2.5 text-xs"
                            style={{
                              backgroundColor: 'var(--bg-surface)',
                              borderColor: 'var(--border-subtle)',
                            }}
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span>
                                {t(
                                  'พื้นที่รูปสลิปเข้ารหัส AES-256',
                                  'Encrypted Slip Images'
                                )}
                              </span>
                              <span className="font-mono-tabular">
                                {formatBytes(totalSlipStorageBytes)}
                              </span>
                            </div>
                            {slipImages.map((img) => (
                              <div
                                key={img.id}
                                className="flex items-center justify-between text-[11px] py-1 border-t"
                                style={{ borderColor: 'var(--border-subtle)' }}
                              >
                                <span className="truncate max-w-[180px] font-mono-tabular">
                                  {img.fileName}
                                </span>
                                <span>
                                  {formatBytes(img.compressedSizeBytes)}
                                </span>
                              </div>
                            ))}
                            {slipImages.length > 0 && (
                              <button
                                onClick={() => setSlipImages([])}
                                className="w-full min-h-[38px] rounded-xl border font-bold cursor-pointer"
                                style={{
                                  borderColor: 'var(--semantic-error)',
                                  color: 'var(--semantic-error)',
                                }}
                              >
                                {t(
                                  'ลบรูปสลิปทั้งหมดเพื่อคืนพื้นที่',
                                  'Free Up Space (Delete All Images)'
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quick Add Bottom Sheet Overlay Inside Phone */}
                  {isQuickAddSheetOpen && (
                    <div className="absolute inset-0 z-40 bg-black/50 flex items-end">
                      <form
                        onSubmit={handleQuickAddSave}
                        className="w-full rounded-t-3xl p-4 space-y-3 border-t"
                        style={{
                          backgroundColor: 'var(--bg-canvas)',
                          borderColor: 'var(--border-subtle)',
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold">
                            {t('จดรายการด่วน', 'Quick Transaction Entry')}
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsQuickAddSheetOpen(false)}
                            className="p-1 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                          <button
                            type="button"
                            onClick={() => setNewTxType('expense')}
                            className="py-2 rounded-xl border cursor-pointer"
                            style={
                              newTxType === 'expense'
                                ? {
                                    backgroundColor: 'var(--semantic-expense)',
                                    color: '#FFFCF7',
                                  }
                                : {}
                            }
                          >
                            {t('รายจ่าย (- ↘)', 'Expense (- ↘)')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewTxType('income')}
                            className="py-2 rounded-xl border cursor-pointer"
                            style={
                              newTxType === 'income'
                                ? {
                                    backgroundColor: 'var(--semantic-income)',
                                    color: '#FFFCF7',
                                  }
                                : {}
                            }
                          >
                            {t('รายรับ (+ ↗)', 'Income (+ ↗)')}
                          </button>
                        </div>
                        <input
                          type="number"
                          value={newTxAmount}
                          onChange={(e) => setNewTxAmount(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border font-mono-tabular font-bold text-sm"
                          style={{
                            backgroundColor: 'var(--bg-surface)',
                            borderColor: 'var(--border-subtle)',
                          }}
                        />
                        <input
                          type="text"
                          value={newTxNote}
                          onChange={(e) => setNewTxNote(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border text-xs"
                          style={{
                            backgroundColor: 'var(--bg-surface)',
                            borderColor: 'var(--border-subtle)',
                          }}
                        />
                        <button
                          type="submit"
                          className="w-full min-h-[42px] rounded-xl text-xs font-bold cursor-pointer"
                          style={{
                            backgroundColor: 'var(--accent-primary)',
                            color: 'var(--accent-on-primary)',
                          }}
                        >
                          {t('บันทึกรายการ', 'Save Transaction')}
                        </button>
                      </form>
                    </div>
                  )}

                  {/* 4. Native Mobile Bottom Navigation Bar (5 Thumb-Zone Tabs) */}
                  <div
                    className="h-16 border-t grid grid-cols-5 items-center px-2 shrink-0"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <button
                      onClick={() => setActiveTab('home')}
                      className="flex flex-col items-center justify-center min-h-[44px] cursor-pointer"
                      style={{
                        color:
                          activeTab === 'home'
                            ? 'var(--accent-secondary)'
                            : 'var(--text-primary)',
                      }}
                    >
                      <Wallet className="w-4 h-4" />
                      <span className="text-[10px] font-bold mt-0.5">
                        {t('หน้าหลัก', 'Home')}
                      </span>
                    </button>

                    <button
                      onClick={() => setActiveTab('calendar')}
                      className="flex flex-col items-center justify-center min-h-[44px] cursor-pointer"
                      style={{
                        color:
                          activeTab === 'calendar'
                            ? 'var(--accent-secondary)'
                            : 'var(--text-primary)',
                      }}
                    >
                      <CalendarIcon className="w-4 h-4" />
                      <span className="text-[10px] font-bold mt-0.5">
                        {t('ปฏิทิน', 'Calendar')}
                      </span>
                    </button>

                    {/* Center Raised Coffee Bean Scan FAB */}
                    <div className="flex justify-center">
                      <button
                        onClick={() => setActiveTab('scan')}
                        className="w-12 h-12 -mt-4 rounded-2xl shadow-lg flex flex-col items-center justify-center cursor-pointer border-2"
                        style={{
                          backgroundColor: AppColors.espresso,
                          color: AppColors.milkCream,
                          borderColor: AppColors.caramel,
                        }}
                        aria-label="Scan Slip or QR"
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                    </div>

                    <button
                      onClick={() => setActiveTab('automation')}
                      className="flex flex-col items-center justify-center min-h-[44px] cursor-pointer"
                      style={{
                        color:
                          activeTab === 'automation'
                            ? 'var(--accent-secondary)'
                            : 'var(--text-primary)',
                      }}
                    >
                      <Bell className="w-4 h-4" />
                      <span className="text-[10px] font-bold mt-0.5">
                        {t('แจ้งเตือน', 'Auto')}
                      </span>
                    </button>

                    <button
                      onClick={() => setActiveTab('settings')}
                      className="flex flex-col items-center justify-center min-h-[44px] cursor-pointer"
                      style={{
                        color:
                          activeTab === 'settings'
                            ? 'var(--accent-secondary)'
                            : 'var(--text-primary)',
                      }}
                    >
                      <Settings className="w-4 h-4" />
                      <span className="text-[10px] font-bold mt-0.5">
                        {t('ตั้งค่า', 'Settings')}
                      </span>
                    </button>
                  </div>

                  {/* 5. OS Home Indicator Bar */}
                  <div
                    className="h-4 flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'var(--bg-surface)' }}
                  >
                    <div
                      className="w-28 h-1 rounded-full opacity-40"
                      style={{ backgroundColor: 'var(--text-primary)' }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            RIGHT COLUMN (7 COLS): MOBILE HARDWARE TESTBENCH & FLUTTER CODEBASE
            ══════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-7 space-y-6">
          {/* Mode Selector Tabs (Merged Simulator + Widgets into 1 tab, Codebase in 2nd tab) */}
          <div
            className="flex items-center gap-2 p-1.5 rounded-2xl border"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <button
              onClick={() => setRightPanelTab('tester')}
              className="flex-1 min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition-all"
              style={
                rightPanelTab === 'tester'
                  ? {
                      backgroundColor: 'var(--accent-primary)',
                      color: 'var(--accent-on-primary)',
                    }
                  : {}
              }
            >
              {t(
                'จำลองสลิป, แจ้งเตือน & วิดเจ็ต iOS/Android',
                'Slip Folder, Notifications & Widgets'
              )}
            </button>
            <button
              onClick={() => setRightPanelTab('code')}
              className="flex-1 min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition-all"
              style={
                rightPanelTab === 'code'
                  ? {
                      backgroundColor: 'var(--accent-primary)',
                      color: 'var(--accent-on-primary)',
                    }
                  : {}
              }
            >
              {t(
                'โค้ด Flutter / Kotlin / Swift ฉบับเต็ม',
                'Full Flutter / Native Codebase'
              )}
            </button>
          </div>

          {/* ── PANEL 1: INTERACTIVE SLIP ALBUM, ANDROID NOTIFICATION & WIDGETS ── */}
          {rightPanelTab === 'tester' && (
            <div className="space-y-6">
              {/* Pre-loaded Thai Bank Notifications to push into the mobile simulator */}
              <div
                className="rounded-3xl border p-5 sm:p-6 space-y-4"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-accent)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold flex items-center gap-2">
                      <Bell
                        className="w-5 h-5 shrink-0"
                        style={{ color: 'var(--accent-secondary)' }}
                      />
                      {t(
                        'จำลองการแจ้งเตือนธนาคารไทยเข้ามือถือ (Android NotificationListener)',
                        'Simulate Thai Bank Push Notifications to Mobile Device'
                      )}
                    </h2>
                    <p className="text-xs opacity-80 mt-0.5">
                      {t(
                        'กดปุ่มด้านล่างเพื่อยิงแจ้งเตือนเข้าเครื่องจำลองฝั่งซ้าย ระบบจะแยกยอดเงิน จัดหมวดหมู่ และเช็กรายการซ้ำกับสลิปทันที',
                        'Click any notification below to push it to the mobile device on the left.'
                      )}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PRELOADED_NOTIFICATIONS.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-4 rounded-2xl border flex flex-col justify-between gap-3"
                      style={{
                        backgroundColor: 'var(--bg-canvas)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span>{notif.appName}</span>
                          <span
                            className="font-mono-tabular"
                            style={{
                              color:
                                notif.expectedType === 'income'
                                  ? 'var(--semantic-income)'
                                  : 'var(--semantic-expense)',
                            }}
                          >
                            {formatTHB(notif.expectedAmount, {
                              showSign: notif.expectedType,
                            })}
                          </span>
                        </div>
                        <p className="text-xs opacity-80 leading-relaxed">
                          {locale === 'th' ? notif.bodyTh : notif.bodyEn}
                        </p>
                      </div>
                      <button
                        onClick={() => handleSimulateBankNotification(notif)}
                        className="w-full min-h-[40px] rounded-xl text-xs font-bold cursor-pointer"
                        style={{
                          backgroundColor: 'var(--accent-primary)',
                          color: 'var(--accent-on-primary)',
                        }}
                      >
                        {t(
                          'ส่งแจ้งเตือนนี้เข้ามือถือ ➔',
                          'Send Notification to Phone ➔'
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Automatic Photo Album Folder Slip Reader (No manual upload required on mobile) */}
              <div
                className="rounded-3xl border p-5 sm:p-6 space-y-4"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1 max-w-xl">
                    <h3 className="text-base font-bold flex items-center gap-2">
                      <FolderTree
                        className="w-5 h-5 shrink-0"
                        style={{ color: 'var(--accent-secondary)' }}
                      />
                      {t(
                        'ระบบอ่านโฟลเดอร์สลิปในอัลบั้มอัตโนมัติ (เมื่อผู้ใช้กดอนุญาต)',
                        'Automatic Bank Slip Folder Reader (Once User Grants Permission)'
                      )}
                    </h3>
                    <p className="text-xs opacity-80 leading-relaxed">
                      {t(
                        'ในการใช้งานจริงบนมือถือ ผู้ใช้ไม่ต้องกดอัปโหลดรูปสลิปเอง — เมื่อกดอนุญาตสิทธิ์เข้าถึงอัลบั้มแล้ว แอปจะเข้าไปสแกนอ่านรูปสลิปใหม่ในโฟลเดอร์ธนาคาร (เช่น K PLUS, SCB Easy, Krungthai NEXT) เองโดยอัตโนมัติเมื่อเปิดแอป',
                        'On a real mobile device, users never have to manually upload slips. Once album permission is granted, Kōhī automatically scans the bank slip folder in the background/on app open.'
                      )}
                    </p>
                  </div>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shrink-0"
                    style={{
                      backgroundColor: 'var(--accent-primary)',
                      color: 'var(--accent-on-primary)',
                    }}
                  >
                    <Camera className="w-4 h-4 shrink-0" />
                    {t(
                      'จำลองมีสลิปใหม่ถูกบันทึกเข้าโฟลเดอร์อัลบั้ม',
                      'Simulate New Slip Saved in Album Folder'
                    )}
                  </button>
                </div>

                {/* Permission & Auto-Folder Status Pill */}
                <div
                  className="p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-2 text-xs"
                  style={{
                    backgroundColor: 'var(--bg-canvas)',
                    borderColor: 'var(--border-accent)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck
                      className="w-4 h-4 shrink-0"
                      style={{
                        color: albumPermissionGranted
                          ? 'var(--semantic-income)'
                          : 'var(--semantic-warning)',
                      }}
                    />
                    <span>
                      {albumPermissionGranted
                        ? t(
                            'สถานะสิทธิ์: อนุญาตแล้ว — แอปกำลังเฝ้าดูและอ่านโฟลเดอร์รูปสลิปในเครื่องให้อัตโนมัติ (พบ 4 ใบล่าสุดด้านล่าง)',
                            'Permission Granted — App automatically reads new slips from the device album folder (4 recent slips found below)'
                          )
                        : t(
                            'สถานะสิทธิ์: ยังไม่ได้อนุญาต — กดปุ่มด้านขวาเพื่อจำลองการกดอนุญาตให้แอปเข้าถึงโฟลเดอร์สลิป',
                            'Permission Not Granted — Click to allow automatic folder scanning'
                          )}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      setAlbumPermissionGranted(!albumPermissionGranted)
                    }
                    className="px-3 py-1 rounded-lg border font-bold cursor-pointer"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    {albumPermissionGranted
                      ? t('จำลองเพิกถอนสิทธิ์', 'Revoke Permission')
                      : t('กดอนุญาตให้อ่านโฟลเดอร์เอง', 'Grant Folder Permission')}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PRELOADED_ALBUM_SLIPS.map((slip) => (
                    <button
                      key={slip.id}
                      onClick={() => handleSelectSampleSlip(slip)}
                      className="text-left p-4 rounded-2xl border space-y-1.5 cursor-pointer hover:opacity-95"
                      style={{
                        backgroundColor: 'var(--bg-canvas)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>
                          {slip.bankCode} ·{' '}
                          {t('อ่านจากโฟลเดอร์อัตโนมัติ', 'Auto-read from folder')}
                        </span>
                        <span className="font-mono-tabular">
                          {formatTHB(slip.amount)}
                        </span>
                      </div>
                      <div className="text-xs font-bold">
                        {locale === 'th' ? slip.titleTh : slip.titleEn}
                      </div>
                      <div className="text-[11px] opacity-70 font-mono-tabular">
                        Ref: {slip.referenceNo}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* iOS & Android Home Screen Widgets, Share Sheet & Shortcuts (Combined in same view) */}
              <div
                className="rounded-3xl border p-5 sm:p-6 space-y-5"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-accent)',
                }}
              >
                <div className="flex items-center gap-2 text-base font-bold">
                  <Smartphone
                    className="w-5 h-5 shrink-0"
                    style={{ color: 'var(--accent-secondary)' }}
                  />
                  <span>
                    {t(
                      'วิดเจ็ต iOS & Android บนหน้าจอโฮม + Share Extension',
                      'iOS & Android Home Screen Widgets + Share Extension'
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Light Mode Widget */}
                  <div
                    className="p-4 rounded-3xl border shadow-md space-y-3"
                    style={{
                      backgroundColor: '#FFF1DE',
                      borderColor: '#D7B896',
                      color: '#56301D',
                    }}
                  >
                    <div className="flex items-center justify-between text-xs font-extrabold">
                      <span>Kōhī · จิบกาแฟ (Light)</span>
                      <span className="font-mono-tabular opacity-75">
                        20 ต.ค. 69
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-[10px] opacity-75">รายรับวันนี้</div>
                        <div
                          className="text-sm font-extrabold font-mono-tabular"
                          style={{ color: '#2E7D5B' }}
                        >
                          +฿0 ↗
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] opacity-75">รายจ่ายวันนี้</div>
                        <div
                          className="text-sm font-extrabold font-mono-tabular"
                          style={{ color: '#B3402F' }}
                        >
                          -฿294 ↘
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setIsQuickAddSheetOpen(true)}
                        className="py-2 rounded-xl text-xs font-bold cursor-pointer"
                        style={{ backgroundColor: '#56301D', color: '#FFF1DE' }}
                      >
                        + จดจ่ายด่วน
                      </button>
                      <button
                        onClick={() => setActiveTab('scan')}
                        className="py-2 rounded-xl text-xs font-bold border cursor-pointer"
                        style={{ borderColor: '#56301D', color: '#56301D' }}
                      >
                        สแกนสลิป
                      </button>
                    </div>
                  </div>

                  {/* Dark Mode Widget */}
                  <div
                    className="p-4 rounded-3xl border shadow-md space-y-3"
                    style={{
                      backgroundColor: '#351A0E',
                      borderColor: '#C98B5E',
                      color: '#FFF1DE',
                    }}
                  >
                    <div className="flex items-center justify-between text-xs font-extrabold">
                      <span>Kōhī · จิบกาแฟ (Dark Roast)</span>
                      <span className="font-mono-tabular opacity-75">
                        20 ต.ค. 69
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-[10px] opacity-75">รายรับวันนี้</div>
                        <div
                          className="text-sm font-extrabold font-mono-tabular"
                          style={{ color: '#6FCF97' }}
                        >
                          +฿0 ↗
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] opacity-75">รายจ่ายวันนี้</div>
                        <div
                          className="text-sm font-extrabold font-mono-tabular"
                          style={{ color: '#FF8A75' }}
                        >
                          -฿294 ↘
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setIsQuickAddSheetOpen(true)}
                        className="py-2 rounded-xl text-xs font-bold cursor-pointer"
                        style={{ backgroundColor: '#D7B896', color: '#1E110A' }}
                      >
                        + จดจ่ายด่วน
                      </button>
                      <button
                        onClick={() => setActiveTab('scan')}
                        className="py-2 rounded-xl text-xs font-bold border cursor-pointer"
                        style={{ borderColor: '#C98B5E', color: '#FFF1DE' }}
                      >
                        สแกนสลิป
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div
                    className="rounded-2xl border p-4 space-y-1.5"
                    style={{
                      backgroundColor: 'var(--bg-canvas)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="text-xs font-bold flex items-center gap-2">
                      <Share2
                        className="w-4 h-4 shrink-0"
                        style={{ color: 'var(--accent-secondary)' }}
                      />
                      <span>iOS Share Extension (แชร์สลิปเข้าแอปทันที)</span>
                    </div>
                    <p className="text-xs opacity-80 leading-relaxed">
                      {t(
                        'กดปุ่ม Share จากแอปธนาคาร → เลือก Kōhī เพื่ออ่าน OCR/QR ในเครื่องทันทีโดยไม่ต้องเปิดแอป',
                        'Tap Share -> Kōhī from any banking app to run Apple Vision Thai OCR in-extension.'
                      )}
                    </p>
                  </div>

                  <div
                    className="rounded-2xl border p-4 space-y-1.5"
                    style={{
                      backgroundColor: 'var(--bg-canvas)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="text-xs font-bold flex items-center gap-2">
                      <Zap
                        className="w-4 h-4 shrink-0"
                        style={{ color: 'var(--accent-secondary)' }}
                      />
                      <span>iOS Back Tap, Action Button & Siri Intents</span>
                    </div>
                    <p className="text-xs opacity-80 leading-relaxed">
                      {t(
                        'เคาะหลังเครื่อง 2 ครั้ง (Back Tap) หรือกดปุ่ม Action Button เพื่อสั่งสแกนสลิปล่าสุดในโฟลเดอร์ทันที',
                        'Attach Kōhī App Intents to iPhone Back Tap, Action Button, or Siri.'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── PANEL 3: FULL FLUTTER / KOTLIN / SWIFT CODE STUDIO ─────────── */}
          {rightPanelTab === 'code' && (
            <div
              className="rounded-3xl border overflow-hidden flex flex-col"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div
                className="p-4 border-b flex flex-wrap items-center justify-between gap-2"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex items-center gap-2 text-sm font-bold">
                  <FolderTree
                    className="w-4 h-4"
                    style={{ color: 'var(--accent-secondary)' }}
                  />
                  <span>
                    {t(
                      'เลือกไฟล์ซอร์สโค้ดสำหรับนำไปติดตั้งบนมือถือ (Flutter / Kotlin / Swift)',
                      'Select Source File (Flutter Dart / Android Kotlin / iOS Swift)'
                    )}
                  </span>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedCodeFile.content);
                    setCopiedFile(selectedCodeFile.path);
                    setTimeout(() => setCopiedFile(null), 2000);
                  }}
                  className="min-h-[36px] px-3 py-1 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-canvas)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  {copiedFile === selectedCodeFile.path ? (
                    <>
                      <Check
                        className="w-3.5 h-3.5"
                        style={{ color: 'var(--semantic-income)' }}
                      />
                      {t('คัดลอกแล้ว', 'Copied')}
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      {t('คัดลอกไฟล์นี้', 'Copy File')}
                    </>
                  )}
                </button>
              </div>

              {/* File Pills Selector */}
              <div
                className="p-3 flex flex-wrap gap-1.5 border-b"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                {FLUTTER_PROJECT_FILES.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedCodeFile(file)}
                    className="px-3 py-1.5 rounded-xl border text-xs font-mono-tabular font-semibold cursor-pointer"
                    style={
                      selectedCodeFile.path === file.path
                        ? {
                            backgroundColor: 'var(--accent-primary)',
                            color: 'var(--accent-on-primary)',
                            borderColor: 'var(--accent-primary)',
                          }
                        : {
                            backgroundColor: 'var(--bg-surface)',
                            borderColor: 'var(--border-subtle)',
                          }
                    }
                  >
                    {file.path.split('/').pop()}
                  </button>
                ))}
              </div>

              <div className="px-4 py-2 text-xs opacity-80">
                <strong className="font-mono-tabular">
                  {selectedCodeFile.path}
                </strong>{' '}
                —{' '}
                {locale === 'th'
                  ? selectedCodeFile.descriptionTh
                  : selectedCodeFile.descriptionEn}
              </div>

              <pre
                className="p-4 text-xs font-mono-tabular overflow-x-auto max-h-[540px] leading-relaxed"
                style={{ backgroundColor: '#1E110A', color: '#FFF1DE' }}
              >
                <code>{selectedCodeFile.content}</code>
              </pre>
            </div>
          )}
        </div>
      </main>

      <MobileInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        locale={locale}
        onDownloadFlutterBundle={handleDownloadFullFlutterBundle}
      />
    </div>
  );
}
