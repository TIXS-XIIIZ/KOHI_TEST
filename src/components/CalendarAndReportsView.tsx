import React, { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  PieChart,
  TrendingUp,
} from 'lucide-react';
import { AppColors, EraType, LocaleCode } from '../theme/appColors';
import { CategoryItem, TransactionRecord } from '../types/kohi';
import {
  formatMonthHeader,
  formatTHB,
  formatThaiDateShort,
} from '../utils/formatters';

interface CalendarAndReportsViewProps {
  transactions: TransactionRecord[];
  categories: CategoryItem[];
  locale: LocaleCode;
  era: EraType;
  hideBalances: boolean;
}

export const CalendarAndReportsView: React.FC<CalendarAndReportsViewProps> = ({
  transactions,
  categories,
  locale,
  era,
  hideBalances,
}) => {
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(9); // 0-indexed: 9 = October 2026
  const [selectedDay, setSelectedDay] = useState<number>(20);
  const [reportPeriod, setReportPeriod] = useState<'week' | 'month' | 'year'>('month');

  const t = (th: string, en: string) => (locale === 'th' ? th : en);

  // SQL-style GROUP BY day aggregation for the selected month
  const dailyMap = useMemo(() => {
    const map: Record<
      number,
      { income: number; expense: number; items: TransactionRecord[] }
    > = {};
    for (const tx of transactions) {
      const d = new Date(tx.timestamp);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        const day = d.getDate();
        if (!map[day]) {
          map[day] = { income: 0, expense: 0, items: [] };
        }
        if (tx.type === 'income') {
          map[day].income += tx.amount;
        } else {
          map[day].expense += tx.amount;
        }
        map[day].items.push(tx);
      }
    }
    return map;
  }, [transactions, currentYear, currentMonth]);

  // Calendar grid generation
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayWeekday = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun

  // SQL-style GROUP BY category aggregation (capping at 8 categories + "Other")
  const categoryBreakdown = useMemo(() => {
    const totals: Record<string, number> = {};
    let totalExpense = 0;

    for (const tx of transactions) {
      if (tx.type !== 'expense') continue;
      const d = new Date(tx.timestamp);
      if (
        reportPeriod === 'month' &&
        (d.getFullYear() !== currentYear || d.getMonth() !== currentMonth)
      ) {
        continue;
      }
      if (reportPeriod === 'year' && d.getFullYear() !== currentYear) {
        continue;
      }
      totals[tx.categoryId] = (totals[tx.categoryId] || 0) + tx.amount;
      totalExpense += tx.amount;
    }

    const sorted = Object.entries(totals)
      .map(([catId, amount]) => {
        const cat = categories.find((c) => c.id === catId);
        return {
          catId,
          name: cat ? (locale === 'th' ? cat.nameTh : cat.nameEn) : catId,
          amount,
          percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    // Group small categories into "Other" when there are more than 8
    if (sorted.length <= 8) {
      return {
        slices: sorted.map((item, idx) => ({
          ...item,
          color: AppColors.chartPalette[idx % AppColors.chartPalette.length],
        })),
        totalExpense,
      };
    }

    const top7 = sorted.slice(0, 7).map((item, idx) => ({
      ...item,
      color: AppColors.chartPalette[idx],
    }));
    const otherSlice = sorted.slice(7).reduce(
      (acc, cur) => ({
        catId: 'other',
        name: locale === 'th' ? 'อื่นๆ (Other)' : 'Other',
        amount: acc.amount + cur.amount,
        percentage: acc.percentage + cur.percentage,
        color: AppColors.chartPalette[7],
      }),
      {
        catId: 'other',
        name: locale === 'th' ? 'อื่นๆ (Other)' : 'Other',
        amount: 0,
        percentage: 0,
        color: AppColors.chartPalette[7],
      }
    );

    return {
      slices: [...top7, otherSlice],
      totalExpense,
    };
  }, [transactions, categories, currentYear, currentMonth, reportPeriod, locale]);

  const monthTotals = useMemo(() => {
    let inc = 0;
    let exp = 0;
    Object.values(dailyMap).forEach((d) => {
      inc += d.income;
      exp += d.expense;
    });
    return { inc, exp, net: inc - exp };
  }, [dailyMap]);

  const selectedDayData = dailyMap[selectedDay] || {
    income: 0,
    expense: 0,
    items: [],
  };

  const weekdayHeaders =
    locale === 'th'
      ? ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDay(1);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDay(1);
  };

  return (
    <div className="space-y-8">
      {/* Monthly Calendar Section */}
      <section
        className="rounded-3xl border p-6 space-y-5"
        style={{
          backgroundColor: 'var(--bg-canvas)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CalendarIcon
              className="w-5 h-5"
              style={{ color: 'var(--accent-secondary)' }}
            />
            <div>
              <h2 className="text-lg font-bold">
                {formatMonthHeader(currentYear, currentMonth, locale, era)}
              </h2>
              <p className="text-xs opacity-75">
                {t(
                  'ปฏิทินสรุปรายรับ-รายจ่ายรายวัน (คำนวณด้วย SQL GROUP BY บนคอลัมน์ที่มี Index)',
                  'Monthly cashflow calendar (SQL GROUP BY indexed date aggregation)'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="min-h-[44px] min-w-[44px] rounded-xl border flex items-center justify-center cursor-pointer hover:opacity-80"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setCurrentYear(2026);
                setCurrentMonth(9);
                setSelectedDay(20);
              }}
              className="min-h-[44px] px-3.5 rounded-xl border text-xs font-semibold cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-accent)',
              }}
            >
              {t('วันนี้ (20 ต.ค.)', 'Today (20 Oct)')}
            </button>
            <button
              onClick={handleNextMonth}
              className="min-h-[44px] min-w-[44px] rounded-xl border flex items-center justify-center cursor-pointer hover:opacity-80"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Monthly Summary Bar */}
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl border"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div>
            <span className="text-xs opacity-75 block">
              {t('รายรับรวมเดือนนี้', 'Monthly Income')}
            </span>
            <span
              className="text-lg font-bold font-mono-tabular flex items-center gap-1"
              style={{ color: 'var(--semantic-income)' }}
            >
              {formatTHB(monthTotals.inc, {
                hideBalance: hideBalances,
                showSign: 'income',
              })}
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div>
            <span className="text-xs opacity-75 block">
              {t('รายจ่ายรวมเดือนนี้', 'Monthly Expense')}
            </span>
            <span
              className="text-lg font-bold font-mono-tabular flex items-center gap-1"
              style={{ color: 'var(--semantic-expense)' }}
            >
              {formatTHB(monthTotals.exp, {
                hideBalance: hideBalances,
                showSign: 'expense',
              })}
              <ArrowDownRight className="w-4 h-4" />
            </span>
          </div>
          <div>
            <span className="text-xs opacity-75 block">
              {t('คงเหลือสุทธิ (Net Balance)', 'Net Balance')}
            </span>
            <span className="text-lg font-bold font-mono-tabular">
              {monthTotals.net >= 0 ? '+' : '-'}
              {formatTHB(Math.abs(monthTotals.net), {
                hideBalance: hideBalances,
              })}
            </span>
          </div>
        </div>

        {/* Calendar Grid (milkCream cells, latte borders, caramel today highlight) */}
        <div>
          <div className="grid grid-cols-7 gap-1.5 mb-2 text-center text-xs font-semibold opacity-75">
            {weekdayHeaders.map((dayName) => (
              <div key={dayName} className="py-1">
                {dayName}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: firstDayWeekday }).map((_, i) => (
              <div key={`empty_${i}`} className="h-20 sm:h-24 rounded-xl opacity-25" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const info = dailyMap[dayNum];
              const isToday =
                currentYear === 2026 && currentMonth === 9 && dayNum === 20;
              const isSelected = selectedDay === dayNum;

              return (
                <button
                  key={dayNum}
                  onClick={() => setSelectedDay(dayNum)}
                  className="h-20 sm:h-24 p-2 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer overflow-hidden"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor:
                      isToday || isSelected
                        ? AppColors.caramel
                        : 'var(--border-subtle)',
                    borderWidth: isToday || isSelected ? '2px' : '1px',
                  }}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className="text-xs font-bold font-mono-tabular w-6 h-6 rounded-lg flex items-center justify-center"
                      style={
                        isToday
                          ? {
                              backgroundColor: AppColors.caramel,
                              color: AppColors.warmWhite,
                            }
                          : {}
                      }
                    >
                      {dayNum}
                    </span>
                    {info && info.items.length > 0 && (
                      <span className="text-[10px] opacity-65 font-mono-tabular">
                        {info.items.length}x
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5 w-full">
                    {info && info.income > 0 && (
                      <div
                        className="text-[10px] sm:text-[11px] font-mono-tabular font-semibold truncate"
                        style={{ color: 'var(--semantic-income)' }}
                      >
                        +{hideBalances ? '•••' : info.income.toLocaleString()} ↗
                      </div>
                    )}
                    {info && info.expense > 0 && (
                      <div
                        className="text-[10px] sm:text-[11px] font-mono-tabular font-semibold truncate"
                        style={{ color: 'var(--semantic-expense)' }}
                      >
                        -{hideBalances ? '•••' : info.expense.toLocaleString()} ↘
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Drilldown Drawer */}
        <div
          className="p-5 rounded-2xl border space-y-3"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">
              {t(
                `รายการวันที่ ${selectedDay} ${formatMonthHeader(currentYear, currentMonth, locale, era)}`,
                `Transactions on ${selectedDay} ${formatMonthHeader(currentYear, currentMonth, locale, era)}`
              )}
            </h3>
            <span className="text-xs font-mono-tabular opacity-80">
              {selectedDayData.items.length} {t('รายการ', 'items')}
            </span>
          </div>

          {selectedDayData.items.length === 0 ? (
            <p className="text-xs opacity-70 py-2">
              {t(
                'ไม่มีรายการในวันนี้ แตะปุ่ม + ด้านบนเพื่อเพิ่มรายการใหม่',
                'No transactions recorded on this day.'
              )}
            </p>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {selectedDayData.items.map((tx) => {
                const cat = categories.find((c) => c.id === tx.categoryId);
                return (
                  <div
                    key={tx.id}
                    className="py-2.5 flex items-center justify-between gap-4 text-sm"
                  >
                    <div>
                      <div className="font-semibold">{tx.note}</div>
                      <div className="text-xs opacity-75">
                        {cat ? (locale === 'th' ? cat.nameTh : cat.nameEn) : ''} ·{' '}
                        {formatThaiDateShort(tx.timestamp, locale, era)}
                      </div>
                    </div>
                    <div
                      className="font-mono-tabular font-bold shrink-0"
                      style={{
                        color:
                          tx.type === 'income'
                            ? 'var(--semantic-income)'
                            : 'var(--semantic-expense)',
                      }}
                    >
                      {formatTHB(tx.amount, {
                        hideBalance: hideBalances,
                        showSign: tx.type,
                      })}{' '}
                      {tx.type === 'income' ? '↗' : '↘'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Charts & Category Breakdown Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Donut & 8-Color Palette Breakdown */}
        <div
          className="rounded-3xl border p-6 space-y-5"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <PieChart
                className="w-5 h-5"
                style={{ color: 'var(--accent-secondary)' }}
              />
              <div>
                <h3 className="text-base font-bold">
                  {t('สัดส่วนรายจ่ายตามหมวดหมู่', 'Expenses by Category')}
                </h3>
                <p className="text-xs opacity-75">
                  {t(
                    'พาเลตต์สีกราฟ 8 ลำดับ (หมวดที่เกิน 8 จะรวมเป็น "อื่นๆ")',
                    'Strict 8-color coffee chart palette (9+ grouped into Other)'
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 p-1 rounded-xl border" style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-subtle)' }}>
              {(['week', 'month', 'year'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setReportPeriod(p)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer"
                  style={
                    reportPeriod === p
                      ? {
                          backgroundColor: 'var(--accent-primary)',
                          color: 'var(--accent-on-primary)',
                        }
                      : {}
                  }
                >
                  {p === 'week'
                    ? t('สัปดาห์', 'Week')
                    : p === 'month'
                    ? t('เดือน', 'Month')
                    : t('ปี', 'Year')}
                </button>
              ))}
            </div>
          </div>

          {/* Stacked visual bar + legend */}
          <div className="h-5 w-full rounded-full overflow-hidden flex border" style={{ borderColor: 'var(--border-subtle)' }}>
            {categoryBreakdown.slices.map((s) => (
              <div
                key={s.catId}
                style={{
                  width: `${Math.max(s.percentage, 3)}%`,
                  backgroundColor: s.color,
                }}
                title={`${s.name}: ${s.percentage.toFixed(1)}%`}
              />
            ))}
          </div>

          <div className="space-y-2.5">
            {categoryBreakdown.slices.map((s) => (
              <div
                key={s.catId}
                className="flex items-center justify-between text-sm py-1 border-b last:border-b-0"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3.5 h-3.5 rounded-sm shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="font-medium">{s.name}</span>
                </div>
                <div className="font-mono-tabular flex items-center gap-3">
                  <span className="text-xs opacity-75">
                    {s.percentage.toFixed(1)}%
                  </span>
                  <span className="font-semibold">
                    {formatTHB(s.amount, { hideBalance: hideBalances })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Income vs Expense Cashflow Bar & Budget Monitor */}
        <div
          className="rounded-3xl border p-6 space-y-5"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <TrendingUp
              className="w-5 h-5"
              style={{ color: 'var(--accent-secondary)' }}
            />
            <div>
              <h3 className="text-base font-bold">
                {t(
                  'งบประมาณรายเดือนและการแจ้งเตือน (Budget Limits)',
                  'Monthly Category Budgets & Thresholds'
                )}
              </h3>
              <p className="text-xs opacity-75">
                {t(
                  'เปลี่ยนเป็นสีเหลืองอำพัน (#D9A441) เมื่อใกล้เต็มงบ และสีแดงเมื่อเกินงบ',
                  'Highlights in Warning Amber (#D9A441) above 80% usage'
                )}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {categories
              .filter((c) => c.type === 'expense' && c.monthlyBudget)
              .slice(0, 6)
              .map((cat) => {
                const spent =
                  categoryBreakdown.slices.find((s) => s.catId === cat.id)
                    ?.amount || 0;
                const budget = cat.monthlyBudget || 1;
                const ratio = Math.min((spent / budget) * 100, 100);
                const isNearLimit = ratio >= 75 && ratio < 100;
                const isOver = spent > budget;

                const barColor = isOver
                  ? 'var(--semantic-error)'
                  : isNearLimit
                  ? 'var(--semantic-warning)'
                  : AppColors.espresso;

                return (
                  <div key={cat.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold">
                        {locale === 'th' ? cat.nameTh : cat.nameEn}
                      </span>
                      <span className="font-mono-tabular">
                        {formatTHB(spent, {
                          hideBalance: hideBalances,
                          decimals: 0,
                        })}{' '}
                        /{' '}
                        {formatTHB(budget, {
                          hideBalance: hideBalances,
                          decimals: 0,
                        })}{' '}
                        ({ ((spent / budget) * 100).toFixed(0) }%)
                      </span>
                    </div>
                    <div
                      className="h-2.5 w-full rounded-full overflow-hidden border"
                      style={{
                        backgroundColor: 'var(--bg-canvas)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${ratio}%`,
                          backgroundColor: barColor,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </section>
    </div>
  );
};
