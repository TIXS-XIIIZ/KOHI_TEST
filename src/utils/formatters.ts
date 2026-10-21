import { EraType, LocaleCode } from '../theme/appColors';

const THAI_MONTHS_SHORT = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];

const THAI_MONTHS_FULL = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

const EN_MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const EN_MONTHS_FULL = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function formatYearByEra(ceYear: number, era: EraType): number {
  return era === 'BE' ? ceYear + 543 : ceYear;
}

export function formatThaiDateShort(isoString: string, locale: LocaleCode, era: EraType): string {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  const day = d.getDate();
  const monthIdx = d.getMonth();
  const year = formatYearByEra(d.getFullYear(), era);
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');

  if (locale === 'th') {
    return `${day} ${THAI_MONTHS_SHORT[monthIdx]} ${year} · ${hours}:${mins} น.`;
  }
  return `${day} ${EN_MONTHS_SHORT[monthIdx]} ${year} · ${hours}:${mins}`;
}

export function formatMonthHeader(ceYear: number, monthIndex0: number, locale: LocaleCode, era: EraType): string {
  const displayYear = formatYearByEra(ceYear, era);
  if (locale === 'th') {
    const eraPrefix = era === 'BE' ? 'พ.ศ.' : 'ค.ศ.';
    return `${THAI_MONTHS_FULL[monthIndex0]} ${eraPrefix} ${displayYear}`;
  }
  const eraSuffix = era === 'BE' ? 'B.E.' : '';
  return `${EN_MONTHS_FULL[monthIndex0]} ${displayYear} ${eraSuffix}`.trim();
}

export function formatTHB(
  amount: number,
  options?: {
    hideBalance?: boolean;
    showSign?: 'income' | 'expense' | 'none';
    decimals?: number;
  }
): string {
  if (options?.hideBalance) {
    return '฿ ••••';
  }
  const decimals = options?.decimals ?? 2;
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  if (options?.showSign === 'income') {
    return `+฿${formatted}`;
  }
  if (options?.showSign === 'expense') {
    return `-฿${formatted}`;
  }
  return `฿${formatted}`;
}
