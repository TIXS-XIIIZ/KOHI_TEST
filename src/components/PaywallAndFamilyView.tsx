import React, { useState } from 'react';
import {
  Check,
  Cloud,
  Crown,
  Lock,
  Sparkles,
  UserPlus,
  Users,
  BellRing,
} from 'lucide-react';
import { FamilyMember, SubscriptionPlan } from '../types/kohi';
import { LocaleCode } from '../theme/appColors';
import { formatTHB } from '../utils/formatters';

interface PaywallAndFamilyViewProps {
  locale: LocaleCode;
  currentPlan: SubscriptionPlan;
  onSelectPlan: (plan: SubscriptionPlan) => void;
  isLoggedIn: boolean;
  userEmail: string;
  onLogin: (provider: 'google' | 'apple' | 'email') => void;
  onLogout: () => void;
  familyMembers: FamilyMember[];
  onInviteMember: (nickname: string, email: string) => void;
  onToggleMemberShare: (id: string, field: 'shareIncome' | 'shareExpense') => void;
}

export const PaywallAndFamilyView: React.FC<PaywallAndFamilyViewProps> = ({
  locale,
  currentPlan,
  onSelectPlan,
  isLoggedIn,
  userEmail,
  onLogin,
  onLogout,
  familyMembers,
  onInviteMember,
  onToggleMemberShare,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [notifyPremium, setNotifyPremium] = useState(false);
  const [inviteNickname, setInviteNickname] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [lastBackupTime, setLastBackupTime] = useState('20 ต.ค. 2569 · 11:30 น.');

  const t = (th: string, en: string) => (locale === 'th' ? th : en);

  return (
    <div className="space-y-8">
      {/* Billing Cadence Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">
            {t('แพ็กเกจสมาชิก Kōhī (Free / Pro / Premium)', 'Kōhī Plans & Subscription')}
          </h2>
          <p className="text-xs opacity-75">
            {t(
              'แพ็กเกจ Free ใช้งานแบบออฟไลน์ได้ครบทุกฟีเจอร์หลักโดยไม่ต้องล็อกอิน ส่วน Pro รองรับแชร์กับครอบครัวและสำรองข้อมูลเข้ารหัส',
              'Free works 100% offline with no account required. Pro unlocks encrypted Cloud Backup & Family Sharing.'
            )}
          </p>
        </div>

        <div
          className="flex items-center gap-1 p-1 rounded-xl border"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <button
            onClick={() => setBillingCycle('monthly')}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
            style={
              billingCycle === 'monthly'
                ? {
                    backgroundColor: 'var(--accent-primary)',
                    color: 'var(--accent-on-primary)',
                  }
                : {}
            }
          >
            {t('รายเดือน (Monthly)', 'Monthly')}
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
            style={
              billingCycle === 'yearly'
                ? {
                    backgroundColor: 'var(--accent-primary)',
                    color: 'var(--accent-on-primary)',
                  }
                : {}
            }
          >
            {t('รายปี (ประหยัด 17%)', 'Yearly (Save 17%)')}
          </button>
        </div>
      </div>

      {/* 3-Column Plan Comparison Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FREE PLAN */}
        <div
          className="rounded-3xl border p-6 flex flex-col justify-between space-y-6"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor:
              currentPlan === 'free'
                ? 'var(--border-accent)'
                : 'var(--border-subtle)',
            borderWidth: currentPlan === 'free' ? '2px' : '1px',
          }}
        >
          <div className="space-y-4">
            <div className="text-xs font-semibold opacity-75">
              {t('สำหรับผู้ใช้งานทั่วไป (Offline-First)', 'For Individual Offline Privacy')}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono-tabular">฿0</span>
              <span className="text-xs opacity-75">{t('/ ตลอดชีพ', '/ forever')}</span>
            </div>
            <ul className="space-y-2.5 text-xs leading-relaxed">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--semantic-income)' }} />
                <span>{t('บันทึกรายรับ-รายจ่ายไม่จำกัด ครบ 14 ธนาคารไทยและพร้อมเพย์', 'Unlimited tracking across all 14 Thai banks & PromptPay')}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--semantic-income)' }} />
                <span>{t('สแกนสลิป OCR + อ่าน QR + อ่านแจ้งเตือน Android ในเครื่อง 100%', 'On-device Slip OCR, EMVCo QR & Android Notification reading')}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--semantic-income)' }} />
                <span>{t('ฐานข้อมูล SQLCipher เข้ารหัสในเครื่อง ไม่ต้องสมัครสมาชิก', 'Encrypted local SQLCipher database without sign-up')}</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => onSelectPlan('free')}
            className="w-full min-h-[44px] rounded-xl text-sm font-bold border cursor-pointer"
            style={{ borderColor: 'var(--border-accent)' }}
          >
            {currentPlan === 'free'
              ? t('แพ็กเกจปัจจุบันของคุณ', 'Current Active Plan')
              : t('สลับเป็นแพ็กเกจ Free', 'Switch to Free')}
          </button>
        </div>

        {/* PRO PLAN */}
        <div
          className="rounded-3xl border p-6 flex flex-col justify-between space-y-6"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-accent)',
            borderWidth: '2px',
          }}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Crown className="w-4 h-4" style={{ color: 'var(--accent-secondary)' }} />
                {t('Kōhī Pro — สำหรับครอบครัวและสำรองข้อมูล', 'Kōhī Pro — For Families & Cloud Sync')}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono-tabular">
                {billingCycle === 'monthly' ? '฿79' : '฿790'}
              </span>
              <span className="text-xs opacity-75">
                {billingCycle === 'monthly'
                  ? t('/ เดือน', '/ month')
                  : t('/ ปี (เฉลี่ย ฿65.8/เดือน)', '/ year')}
              </span>
            </div>
            <ul className="space-y-2.5 text-xs leading-relaxed">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--semantic-income)' }} />
                <span>{t('ทุกฟีเจอร์ใน Free + สำรองข้อมูลและรูปสลิปขึ้น Cloud แบบเข้ารหัส E2EE', 'Everything in Free + E2EE Cloud Backup for data & compressed slips')}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--semantic-income)' }} />
                <span>{t('Family Sharing: เชิญสมาชิกในครอบครัว ตั้งชื่อเล่น และเลือกแชร์เฉพาะรายรับหรือรายจ่ายได้', 'Family Sharing: Invite members, set nicknames, and customize shared visibility')}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--semantic-income)' }} />
                <span>{t('ซิงก์ข้ามอุปกรณ์ iOS และ Android (Conflict resolution: Last-Write-Wins)', 'Cross-device sync between iOS & Android')}</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => onSelectPlan('pro')}
            className="w-full min-h-[44px] rounded-xl text-sm font-bold cursor-pointer"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--accent-on-primary)',
            }}
          >
            {currentPlan === 'pro'
              ? t('ใช้งาน Kōhī Pro อยู่', 'Active Plan: Kōhī Pro')
              : t('อัปเกรดเป็น Kōhī Pro', 'Upgrade to Kōhī Pro')}
          </button>
        </div>

        {/* PREMIUM PLAN (COMING SOON TEASER) */}
        <div
          className="rounded-3xl border p-6 flex flex-col justify-between space-y-6 opacity-95"
          style={{
            backgroundColor: 'var(--bg-canvas)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" style={{ color: 'var(--accent-secondary)' }} />
                {t('Kōhī Premium — เร็วๆ นี้ (Coming Soon)', 'Kōhī Premium — Coming Soon')}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono-tabular">฿149</span>
              <span className="text-xs opacity-75">{t('/ เดือน', '/ month')}</span>
            </div>
            <p className="text-xs opacity-80 leading-relaxed">
              {t(
                'เตรียมพบกับระบบวางแผนภาษีลดหย่อนไทย (Thai Tax Allowance Optimizer), พอร์ตการลงทุน และรายงานกระแสเงินสดเชิงลึก เร็วๆ นี้',
                'Upcoming teaser: Thai Personal Income Tax deduction tracker, multi-currency wealth portfolio, and automated receipt warranty vault.'
              )}
            </p>
          </div>

          <button
            onClick={() => setNotifyPremium(!notifyPremium)}
            className="w-full min-h-[44px] rounded-xl text-xs font-bold border flex items-center justify-center gap-2 cursor-pointer"
            style={{
              backgroundColor: notifyPremium ? 'var(--bg-surface)' : 'transparent',
              borderColor: 'var(--border-accent)',
            }}
          >
            <BellRing className="w-4 h-4" />
            {notifyPremium
              ? t('ลงทะเบียนรับแจ้งเตือนเมื่อเปิดตัวแล้ว ✓', 'Subscribed to Launch Notification ✓')
              : t('แจ้งเตือนฉันเมื่อเปิดใช้งาน (Notify Me)', 'Notify Me When Available')}
          </button>
        </div>
      </div>

      {/* Authentication & Pro Family Sharing Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account & Sign-in Card (App Store Guideline 4.8 compliant) */}
        <div
          className="rounded-3xl border p-6 space-y-4"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-2 text-base font-bold">
            <Lock className="w-4 h-4" style={{ color: 'var(--accent-secondary)' }} />
            <span>
              {t(
                'บัญชีผู้ใช้และการเข้าสู่ระบบ (เฉพาะ Pro ขึ้นไป)',
                'Account & Authentication (Required for Pro)'
              )}
            </span>
          </div>

          {!isLoggedIn ? (
            <div className="space-y-3">
              <p className="text-xs opacity-80">
                {t(
                  'เข้าสู่ระบบเพื่อเปิดใช้งาน Cloud Backup เข้ารหัส และแชร์กระเป๋าครอบครัว (รองรับ Google, Sign in with Apple ตามข้อกำหนด App Store 4.8 และอีเมล)',
                  'Sign in to enable encrypted Cloud Backup and Family Sharing (Supports Google, Sign in with Apple per App Store 4.8, and Email).'
                )}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  onClick={() => onLogin('google')}
                  className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-canvas)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  Continue with Google
                </button>
                <button
                  onClick={() => onLogin('apple')}
                  className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer"
                  style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: 'var(--accent-on-primary)',
                    borderColor: 'var(--accent-primary)',
                  }}
                >
                  Sign in with Apple
                </button>
                <button
                  onClick={() => onLogin('email')}
                  className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-canvas)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  Email / Password
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-2xl border" style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-subtle)' }}>
                <div>
                  <div className="text-sm font-bold">คุณ ธีรภัทร (Owner)</div>
                  <div className="text-xs opacity-75 font-mono-tabular">{userEmail}</div>
                </div>
                <button
                  onClick={onLogout}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  {t('ออกจากระบบ', 'Sign Out')}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="flex items-center gap-1.5">
                  <Cloud className="w-4 h-4" style={{ color: 'var(--semantic-income)' }} />
                  {t('สำรองข้อมูล E2EE ล่าสุด:', 'Last Encrypted Backup:')} {lastBackupTime}
                </span>
                <button
                  onClick={() => setLastBackupTime(t('เมื่อสักครู่นี้ (ซิงก์สำเร็จ)', 'Just now (Synced)'))}
                  className="underline font-semibold cursor-pointer"
                >
                  {t('สำรองข้อมูลเดี๋ยวนี้', 'Backup Now')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pro Family Sharing Manager */}
        <div
          className="rounded-3xl border p-6 space-y-4"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-base font-bold">
              <Users className="w-4 h-4" style={{ color: 'var(--accent-secondary)' }} />
              <span>{t('แชร์ข้อมูลในครอบครัว (Pro Family Sharing)', 'Pro Family Sharing')}</span>
            </div>
            <span className="text-xs opacity-75">
              {familyMembers.length} {t('สมาชิก', 'members')}
            </span>
          </div>

          <div className="divide-y text-xs" style={{ borderColor: 'var(--border-subtle)' }}>
            {familyMembers.map((m) => (
              <div key={m.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-sm">
                    {m.nickname} · <span className="opacity-70 font-normal">{m.role.toUpperCase()}</span>
                  </div>
                  <div className="opacity-75 font-mono-tabular">{m.email}</div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={m.shareIncome}
                      onChange={() => onToggleMemberShare(m.id, 'shareIncome')}
                    />
                    <span>
                      {t('แชร์รายรับ', 'Income')}{' '}
                      {m.shareIncome && (
                        <strong className="font-mono-tabular" style={{ color: 'var(--semantic-income)' }}>
                          ({formatTHB(m.monthlyIncomeShared, { decimals: 0 })})
                        </strong>
                      )}
                    </span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={m.shareExpense}
                      onChange={() => onToggleMemberShare(m.id, 'shareExpense')}
                    />
                    <span>
                      {t('แชร์รายจ่าย', 'Expense')}{' '}
                      {m.shareExpense && (
                        <strong className="font-mono-tabular" style={{ color: 'var(--semantic-expense)' }}>
                          ({formatTHB(m.monthlyExpenseShared, { decimals: 0 })})
                        </strong>
                      )}
                    </span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          {/* Invite Family Member Form */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder={t('ชื่อเล่น (เช่น คุณแม่, พี่พลอย)', 'Nickname (e.g. Ploy)')}
              value={inviteNickname}
              onChange={(e) => setInviteNickname(e.target.value)}
              className="flex-1 min-h-[40px] px-3 rounded-xl border text-xs"
              style={{
                backgroundColor: 'var(--bg-canvas)',
                borderColor: 'var(--border-subtle)',
              }}
            />
            <input
              type="email"
              placeholder={t('อีเมลสมาชิก', 'Member email')}
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1 min-h-[40px] px-3 rounded-xl border text-xs"
              style={{
                backgroundColor: 'var(--bg-canvas)',
                borderColor: 'var(--border-subtle)',
              }}
            />
            <button
              onClick={() => {
                if (!inviteNickname.trim() || !inviteEmail.trim()) return;
                onInviteMember(inviteNickname.trim(), inviteEmail.trim());
                setInviteNickname('');
                setInviteEmail('');
              }}
              className="min-h-[40px] px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--accent-on-primary)',
              }}
            >
              <UserPlus className="w-3.5 h-3.5" />
              {t('เชิญเข้าครอบครัว', 'Invite')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
