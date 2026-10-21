import {
  CategoryItem,
  CategoryRule,
  ParsedSlipOrQrDraft,
  ThaiBankCode,
  TransactionRecord,
} from '../types/kohi';

/**
 * Computes CRC16-CCITT (0xFFFF initial, polynomial 0x1021) for Thai PromptPay / EMVCo QR payloads.
 */
export function computeEmvCrc16(payloadWithoutCrcValue: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payloadWithoutCrcValue.length; i++) {
    crc ^= payloadWithoutCrcValue.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export interface EmvQrParseResult {
  isValidFormat: boolean;
  crcValid: boolean;
  calculatedCrc: string;
  providedCrc: string;
  promptPayId?: string;
  billerId?: string;
  amount?: number;
  countryCode?: string;
  currencyCode?: string;
  tags: Record<string, string>;
}

/**
 * Parses an EMVCo / Thai PromptPay TLV QR string.
 */
export function parseThaiPromptPayQr(rawPayload: string): EmvQrParseResult {
  const clean = rawPayload.trim();
  const tags: Record<string, string> = {};
  let idx = 0;

  while (idx + 4 <= clean.length) {
    const tag = clean.substring(idx, idx + 2);
    const lenStr = clean.substring(idx + 2, idx + 4);
    const len = parseInt(lenStr, 10);
    if (isNaN(len) || idx + 4 + len > clean.length) {
      break;
    }
    const val = clean.substring(idx + 4, idx + 4 + len);
    tags[tag] = val;
    idx += 4 + len;
  }

  const providedCrc = (tags['63'] || '').toUpperCase();
  const crcIndex = clean.lastIndexOf('6304');
  const payloadForCrc = crcIndex !== -1 ? clean.substring(0, crcIndex + 4) : clean;
  const calculatedCrc = computeEmvCrc16(payloadForCrc);
  const crcValid = providedCrc.length === 4 ? providedCrc === calculatedCrc : true;

  // Sub-parse Tag 29 (PromptPay Credit Transfer) or Tag 30 (PromptPay Bill Payment)
  let promptPayId: string | undefined;
  let billerId: string | undefined;

  const parseSubTlv = (subRaw: string): Record<string, string> => {
    const subTags: Record<string, string> = {};
    let sIdx = 0;
    while (sIdx + 4 <= subRaw.length) {
      const sTag = subRaw.substring(sIdx, sIdx + 2);
      const sLen = parseInt(subRaw.substring(sIdx + 2, sIdx + 4), 10);
      if (isNaN(sLen) || sIdx + 4 + sLen > subRaw.length) break;
      subTags[sTag] = subRaw.substring(sIdx + 4, sIdx + 4 + sLen);
      sIdx += 4 + sLen;
    }
    return subTags;
  };

  if (tags['29']) {
    const sub29 = parseSubTlv(tags['29']);
    promptPayId = sub29['01'] || sub29['02'] || sub29['03'];
  }
  if (tags['30']) {
    const sub30 = parseSubTlv(tags['30']);
    billerId = sub30['01'] || sub30['02'];
  }

  const amount = tags['54'] ? parseFloat(tags['54']) : undefined;

  return {
    isValidFormat: Boolean(tags['00'] === '01' && (tags['29'] || tags['30'] || tags['54'])),
    crcValid,
    calculatedCrc,
    providedCrc,
    promptPayId,
    billerId,
    amount: amount && !isNaN(amount) ? amount : undefined,
    countryCode: tags['58'],
    currencyCode: tags['53'],
    tags,
  };
}

/**
 * Auto-categorizes a transaction based on learned rules & keyword matching.
 */
export function matchCategoryByRules(
  textToSearch: string,
  type: 'income' | 'expense',
  rules: CategoryRule[],
  categories: CategoryItem[]
): string {
  const normalized = textToSearch.toLowerCase();
  for (const rule of rules) {
    if (normalized.includes(rule.keyword.toLowerCase())) {
      const cat = categories.find((c) => c.id === rule.categoryId && c.type === type);
      if (cat) return cat.id;
    }
  }
  // Fallback defaults
  if (type === 'income') {
    return categories.find((c) => c.id === 'cat_transfer_in')?.id || 'cat_salary';
  }
  return categories.find((c) => c.id === 'cat_food')?.id || 'cat_coffee';
}

/**
 * Duplicate Detection Engine:
 * Matches if:
 * 1) Non-empty referenceNo matches an existing transaction's referenceNo, OR
 * 2) Exact same amount AND timestamp within ±5 minutes (300,000 ms).
 */
export function findDuplicateTransaction(
  draft: { amount: number; timestamp: string; referenceNo?: string },
  existingTransactions: TransactionRecord[]
): TransactionRecord | undefined {
  const draftTimeMs = new Date(draft.timestamp).getTime();
  const cleanRef = (draft.referenceNo || '').trim().toUpperCase();

  for (const tx of existingTransactions) {
    const txRef = (tx.referenceNo || '').trim().toUpperCase();
    if (cleanRef && txRef && cleanRef === txRef) {
      return tx;
    }
    if (Math.abs(tx.amount - draft.amount) < 0.01 && !isNaN(draftTimeMs)) {
      const txTimeMs = new Date(tx.timestamp).getTime();
      if (!isNaN(txTimeMs) && Math.abs(txTimeMs - draftTimeMs) <= 5 * 60 * 1000) {
        return tx;
      }
    }
  }
  return undefined;
}

/**
 * Pluggable Thai Bank Slip OCR Text Parser
 * Supports K PLUS, SCB Easy, Krungthai NEXT, Bangkok Bank, Krungsri KMA, ttb touch, GSB MyMo, TrueMoney
 */
export function parseThaiSlipOcrText(
  rawText: string,
  rules: CategoryRule[],
  categories: CategoryItem[],
  existingTransactions: TransactionRecord[],
  qrPayload?: string
): ParsedSlipOrQrDraft {
  const text = rawText.trim();

  // Detect bank code
  let bankCode: ThaiBankCode = 'KBANK';
  let accountId = 'acc_kbank';
  if (/ไทยพาณิชย์|SCB/i.test(text)) {
    bankCode = 'SCB';
    accountId = 'acc_scb';
  } else if (/กรุงไทย|Krungthai|KTB/i.test(text)) {
    bankCode = 'KTB';
    accountId = 'acc_ktb';
  } else if (/กรุงเทพ|Bangkok Bank|BBL/i.test(text)) {
    bankCode = 'BBL';
    accountId = 'acc_bbl';
  } else if (/กรุงศรี|KMA|Krungsri/i.test(text)) {
    bankCode = 'BAY';
    accountId = 'acc_bay';
  } else if (/ทีทีบี|ttb/i.test(text)) {
    bankCode = 'TTB';
    accountId = 'acc_ttb';
  } else if (/ออมสิน|MyMo|GSB/i.test(text)) {
    bankCode = 'GSB';
    accountId = 'acc_gsb';
  } else if (/TrueMoney|ทรูมันนี่/i.test(text)) {
    bankCode = 'TRUEMONEY';
    accountId = 'acc_truemoney';
  } else if (/พร้อมเพย์|PromptPay/i.test(text)) {
    bankCode = 'PROMPTPAY';
    accountId = 'acc_promptpay';
  }

  // Extract amount
  const amountMatch =
    text.match(/(?:จำนวน(?:เงิน)?|Amount)[:\s]*([0-9,]+\.?[0-9]*)\s*(?:บาท|THB|บ\.)?/i) ||
    text.match(/([0-9,]+\.[0-9]{2})\s*(?:บาท|THB|บ\.)/i);
  let amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;

  // Check QR payload if provided
  let crcValid = true;
  if (qrPayload) {
    const qrParsed = parseThaiPromptPayQr(qrPayload);
    crcValid = qrParsed.crcValid;
    if (!amount && qrParsed.amount) {
      amount = qrParsed.amount;
    }
  }
  if (!amount || isNaN(amount)) amount = 85;

  // Detect income vs expense
  const isIncome = /เงินเข้า|รับโอน|เข้าบัญชี.*คุณ ธีรภัทร/i.test(text);
  const type: 'income' | 'expense' = isIncome ? 'income' : 'expense';

  // Extract reference number
  const refMatch = text.match(/(?:รหัสอ้างอิง|เลขอ้างอิง|อ้างอิง|Ref(?:\.|erence)?)[:\s]*([A-Za-z0-9_-]{8,28})/i);
  const referenceNo = refMatch ? refMatch[1].trim() : `SLIP${Date.now().toString().slice(-10)}`;

  // Extract sender & receiver
  const receiverMatch = text.match(/(?:ไปยัง|ให้แก่|เข้าบัญชี|To)[:\s]*([^\n\r]+)/i);
  const senderMatch = text.match(/(?:จาก|นาย|น\.ส\.|คุณ)[:\s]*([^\n\r]+)/i);
  const receiverName = receiverMatch ? receiverMatch[1].trim() : 'ร้านค้าพร้อมเพย์ (PromptPay Merchant)';
  const senderName = senderMatch ? senderMatch[0].replace(/^จาก[:\s]*/i, '').trim() : 'คุณ ธีรภัทร';

  // Extract memo
  const memoMatch = text.match(/(?:บันทึก(?:ช่วยจำ)?|ข้อความ|Memo|Note)[:\s]*([^\n\r]+)/i);
  const memo = memoMatch ? memoMatch[1].trim() : receiverName;

  const timestamp = '2026-10-20T12:00:00+07:00';
  const categoryId = matchCategoryByRules(`${receiverName} ${memo}`, type, rules, categories);
  const duplicate = findDuplicateTransaction({ amount, timestamp, referenceNo }, existingTransactions);

  return {
    amount,
    type,
    timestamp,
    bankCode,
    accountId,
    categoryId,
    referenceNo,
    senderName,
    receiverName,
    memo,
    source: qrPayload ? 'slip_ocr' : 'slip_ocr',
    qrPayloadRaw: qrPayload,
    crcValid,
    duplicateOfId: duplicate?.id,
  };
}

/**
 * Parses Android Notification text from allowlisted Thai banking package names
 */
export function parseThaiBankNotification(
  notif: {
    packageName: string;
    bodyTh: string;
    timestampIso: string;
  },
  rules: CategoryRule[],
  categories: CategoryItem[],
  existingTransactions: TransactionRecord[]
): ParsedSlipOrQrDraft {
  const text = notif.bodyTh;
  let bankCode: ThaiBankCode = 'KBANK';
  let accountId = 'acc_kbank';

  if (notif.packageName.includes('scb')) {
    bankCode = 'SCB';
    accountId = 'acc_scb';
  } else if (notif.packageName.includes('ktb')) {
    bankCode = 'KTB';
    accountId = 'acc_ktb';
  } else if (notif.packageName.includes('TMBTOUCH')) {
    bankCode = 'TTB';
    accountId = 'acc_ttb';
  } else if (notif.packageName.includes('truemoney')) {
    bankCode = 'TRUEMONEY';
    accountId = 'acc_truemoney';
  }

  const isIncome = /เงินเข้า|รับเงิน|Received/i.test(text);
  const type: 'income' | 'expense' = isIncome ? 'income' : 'expense';

  const amtMatch = text.match(/([0-9,]+\.[0-9]{2})\s*(?:บาท|บ\.|THB)/i);
  const amount = amtMatch ? parseFloat(amtMatch[1].replace(/,/g, '')) : 100;

  const refMatch = text.match(/(?:อ้างอิง|เลขอ้างอิง|Ref:?)[:\s]*([A-Za-z0-9]+)/i);
  const referenceNo = refMatch ? refMatch[1].trim() : `NOTIF${Date.now().toString().slice(-8)}`;

  const merchantMatch = text.match(/(?:ไปยัง|ให้แก่|จาก)\s+([^วันที่\n(]+?)(?:\s+วันที่|\s+เมื่อ|$)/i);
  const counterpart = merchantMatch ? merchantMatch[1].trim() : bankCode;

  const categoryId = matchCategoryByRules(counterpart, type, rules, categories);
  const duplicate = findDuplicateTransaction(
    { amount, timestamp: notif.timestampIso, referenceNo },
    existingTransactions
  );

  return {
    amount,
    type,
    timestamp: notif.timestampIso,
    bankCode,
    accountId,
    categoryId,
    referenceNo,
    senderName: type === 'income' ? counterpart : 'คุณ ธีรภัทร',
    receiverName: type === 'expense' ? counterpart : 'คุณ ธีรภัทร',
    memo: `${bankCode} Auto-Notif: ${counterpart}`,
    source: 'notification',
    duplicateOfId: duplicate?.id,
  };
}
