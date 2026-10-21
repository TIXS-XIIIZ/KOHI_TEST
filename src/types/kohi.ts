export type TransactionType = 'income' | 'expense';
export type TransactionSource = 'manual' | 'slip_ocr' | 'qr_scan' | 'notification';

export type ThaiBankCode =
  | 'KBANK'
  | 'SCB'
  | 'KTB'
  | 'BBL'
  | 'BAY'
  | 'TTB'
  | 'GSB'
  | 'BAAC'
  | 'CIMB'
  | 'UOB'
  | 'LHB'
  | 'KKP'
  | 'TRUEMONEY'
  | 'PROMPTPAY';

export interface BankAccount {
  id: string;
  bankCode: ThaiBankCode;
  appNameTh: string;
  appNameEn: string;
  bankNameTh: string;
  bankNameEn: string;
  packageName: string; // Android package allowlist for NotificationListenerService
  accountNumberMasked: string;
  initialBalance: number;
  isDefault?: boolean;
}

export interface CategoryItem {
  id: string;
  nameTh: string;
  nameEn: string;
  type: TransactionType;
  iconKey: string;
  colorIndex: number; // maps to AppColors.chartPalette
  monthlyBudget?: number;
  isCustom?: boolean;
}

export interface TransactionRecord {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  accountId: string;
  timestamp: string; // ISO string in Asia/Bangkok
  note: string;
  tags: string[];
  referenceNo?: string;
  senderName?: string;
  receiverName?: string;
  source: TransactionSource;
  slipImageId?: string;
  isRecurring?: boolean;
  recurringInterval?: 'daily' | 'weekly' | 'monthly';
}

export interface CategoryRule {
  id: string;
  keyword: string; // normalized lowercase keyword or merchant
  categoryId: string;
  learnedFromUser: boolean;
  hitCount: number;
}

export interface StoredSlipImage {
  id: string;
  transactionId?: string;
  fileName: string;
  compressedDataUrl: string;
  thumbnailDataUrl: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  width: number;
  height: number;
  exifStripped: boolean;
  encryptedAesGcm: boolean;
  createdAt: string;
}

export interface ParsedSlipOrQrDraft {
  amount: number;
  type: TransactionType;
  timestamp: string;
  bankCode: ThaiBankCode;
  accountId: string;
  categoryId: string;
  referenceNo: string;
  senderName: string;
  receiverName: string;
  memo: string;
  source: TransactionSource;
  qrPayloadRaw?: string;
  crcValid?: boolean;
  duplicateOfId?: string;
  slipImage?: StoredSlipImage;
}

export interface FamilyMember {
  id: string;
  nickname: string;
  email: string;
  role: 'owner' | 'member';
  shareIncome: boolean;
  shareExpense: boolean;
  monthlyIncomeShared: number;
  monthlyExpenseShared: number;
  lastSyncedAt: string;
}

export type SubscriptionPlan = 'free' | 'pro' | 'premium';
