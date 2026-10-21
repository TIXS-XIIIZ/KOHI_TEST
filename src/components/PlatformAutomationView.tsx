import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Smartphone,
  Shield,
  Share2,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { PRELOADED_NOTIFICATIONS, PreloadedBankNotification, THAI_BANKS_AND_WALLETS } from '../data/seedData';
import { LocaleCode } from '../theme/appColors';
import { formatTHB } from '../utils/formatters';

interface PlatformAutomationViewProps {
  locale: LocaleCode;
  androidNotifEnabled: boolean;
  onToggleAndroidNotif: (enabled: boolean) => void;
  autoSaveNotif: boolean;
  onToggleAutoSaveNotif: (autoSave: boolean) => void;
  onSimulateNotification: (notif: PreloadedBankNotification) => void;
  lastNotifFeedback: string | null;
}

export const PlatformAutomationView: React.FC<PlatformAutomationViewProps> = ({
  locale,
  androidNotifEnabled,
  onToggleAndroidNotif,
  autoSaveNotif,
  onToggleAutoSaveNotif,
  onSimulateNotification,
  lastNotifFeedback,
}) => {
  const [selectedPlatformTab, setSelectedPlatformTab] = useState<'android' | 'ios'>('android');
  const [selectedOem, setSelectedOem] = useState<'samsung' | 'xiaomi' | 'oppo' | 'vivo'>('samsung');

  const t = (th: string, en: string) => (locale === 'th' ? th : en);

  return (
    <div className="space-y-6">
      {/* Platform Selector */}
      <div
        className="flex items-center gap-2 p-1.5 rounded-2xl border max-w-md"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <button
          onClick={() => setSelectedPlatformTab('android')}
          className="flex-1 min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all"
          style={
            selectedPlatformTab === 'android'
              ? {
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--accent-on-primary)',
                }
              : {}
          }
        >
          Android Notification Listener
        </button>
        <button
          onClick={() => setSelectedPlatformTab('ios')}
          className="flex-1 min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all"
          style={
            selectedPlatformTab === 'ios'
              ? {
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--accent-on-primary)',
                }
              : {}
          }
        >
          iOS Widgets & Shortcuts
        </button>
      </div>

      {selectedPlatformTab === 'android' ? (
        <div className="space-y-6">
          {/* Education & Permission Disclosure Card */}
          <div
            className="rounded-3xl border p-6 space-y-4"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-accent)',
            }}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <Shield className="w-5 h-5" style={{ color: 'var(--semantic-income)' }} />
                  <span>
                    {t(
                      'การอ่านแจ้งเตือนธนาคารบน Android (On-Device NotificationListenerService)',
                      'Android On-Device Notification Reading (Google Play Policy Compliant)'
                    )}
                  </span>
                </div>
                <p className="text-sm opacity-85 leading-relaxed">
                  {t(
                    'อ่านเฉพาะการแจ้งเตือนจากรายชื่อแอปธนาคารไทยที่อนุญาต (Allowlist 14 ธนาคาร/วอลเล็ท) ประมวลผลด้วย Regex ในเครื่อง 100% ไม่มีการอัปโหลดข้อความแจ้งเตือนขึ้นเซิร์ฟเวอร์ เมื่อเปิดโหมดนี้ ระบบจะปิดการถามสแกนสลิปอัตโนมัติเมื่อเปิดแอปเพื่อไม่ให้รบกวนคุณ',
                    'Reads notifications strictly from the 14 allowlisted Thai banking package names on-device. When enabled, automatic app-open QR/OCR prompt is turned OFF.'
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => onToggleAndroidNotif(!androidNotifEnabled)}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-bold cursor-pointer"
                  style={{
                    backgroundColor: androidNotifEnabled
                      ? 'var(--semantic-income)'
                      : 'var(--accent-primary)',
                    color: '#FFFCF7',
                  }}
                >
                  {androidNotifEnabled
                    ? t('เปิดอ่านการแจ้งเตือนอยู่ (ON)', 'Notification Listener ON')
                    : t('อนุญาตการเข้าถึง (Allow)', 'Allow Notification Access')}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-3 border-t text-xs" style={{ borderColor: 'var(--border-subtle)' }}>
              <span>
                {t('สถานะโหมดสแกนสลิปเมื่อเปิดแอป:', 'QR/OCR on App Open Mode:')}{' '}
                <strong>
                  {androidNotifEnabled
                    ? t('ปิดอัตโนมัติ (OFF)', 'OFF (Handled by Notifications)')
                    : t('เปิดทำงาน (ON)', 'ON (Prompts Photo Album Scan)')}
                </strong>
              </span>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSaveNotif}
                  onChange={(e) => onToggleAutoSaveNotif(e.target.checked)}
                  className="w-4 h-4"
                />
                <span>
                  {t(
                    'บันทึกรายการอัตโนมัติทันที (หากไม่เลือก จะเปิดหน้าต่างยืนยันก่อน)',
                    'Auto-save parsed notifications immediately'
                  )}
                </span>
              </label>
            </div>
          </div>

          {/* Pre-loaded Thai Bank Notifications Simulator */}
          <div
            className="rounded-3xl border p-6 space-y-4"
            style={{
              backgroundColor: 'var(--bg-canvas)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Bell className="w-4 h-4" style={{ color: 'var(--accent-secondary)' }} />
                  {t(
                    'การแจ้งเตือนที่โหลดไว้ล่วงหน้า (แตะเพื่อจำลองการแจ้งเตือนเข้าเครื่อง)',
                    'Pre-loaded Thai Bank Notifications (Tap to Trigger On-Device Parser)'
                  )}
                </h3>
                <p className="text-xs opacity-75">
                  {t(
                    'ทดสอบการแยกยอดเงิน บัญชี หมวดหมู่ และการป้องกันรายการซ้ำกับสลิปในอัลบั้ม',
                    'Test amount extraction, auto-categorization, and duplicate detection against slip scans.'
                  )}
                </p>
              </div>
            </div>

            {lastNotifFeedback && (
              <div
                className="p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-accent)',
                }}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'var(--semantic-income)' }} />
                <span>{lastNotifFeedback}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {PRELOADED_NOTIFICATIONS.map((notif) => (
                <div
                  key={notif.id}
                  className="p-4 rounded-2xl border flex flex-col justify-between gap-3"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs opacity-75">
                      <span className="font-mono-tabular">{notif.packageName}</span>
                      <span className="font-mono-tabular font-bold">
                        {formatTHB(notif.expectedAmount, {
                          showSign: notif.expectedType,
                        })}
                      </span>
                    </div>
                    <div className="text-sm font-bold">{notif.title}</div>
                    <p className="text-xs opacity-85 leading-relaxed">
                      {locale === 'th' ? notif.bodyTh : notif.bodyEn}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span className="text-[11px] font-mono-tabular opacity-70">
                      Ref: {notif.referenceNo}
                    </span>
                    <button
                      onClick={() => onSimulateNotification(notif)}
                      className="min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
                      style={{
                        backgroundColor: 'var(--accent-primary)',
                        color: 'var(--accent-on-primary)',
                      }}
                    >
                      {t('ยิงแจ้งเตือนนี้', 'Simulate Notification')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Allowlisted Thai Bank Packages & OEM Battery Guide */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div
              className="rounded-3xl border p-6 space-y-3"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <h3 className="text-sm font-bold">
                {t(
                  'รายชื่อ Package แอปธนาคารไทยที่อนุญาต (Allowlist v1.4)',
                  'Allowlisted Thai Bank & Wallet Packages (v1.4)'
                )}
              </h3>
              <div className="max-h-56 overflow-y-auto divide-y text-xs" style={{ borderColor: 'var(--border-subtle)' }}>
                {THAI_BANKS_AND_WALLETS.map((b) => (
                  <div key={b.id} className="py-2 flex items-center justify-between gap-2">
                    <span className="font-semibold">
                      {locale === 'th' ? b.appNameTh : b.appNameEn}
                    </span>
                    <span className="font-mono-tabular opacity-75">{b.packageName}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="rounded-3xl border p-6 space-y-4"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <h3 className="text-sm font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" style={{ color: 'var(--accent-secondary)' }} />
                {t(
                  'คู่มือตั้งค่าไม่ให้ระบบประหยัดพลังงานปิดบริการ (OEM Battery Guide)',
                  'OEM Background Service & Battery Optimization Guide'
                )}
              </h3>
              <div className="flex gap-1.5">
                {(['samsung', 'xiaomi', 'oppo', 'vivo'] as const).map((oem) => (
                  <button
                    key={oem}
                    onClick={() => setSelectedOem(oem)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold uppercase cursor-pointer border"
                    style={
                      selectedOem === oem
                        ? {
                            backgroundColor: 'var(--accent-primary)',
                            color: 'var(--accent-on-primary)',
                            borderColor: 'var(--accent-primary)',
                          }
                        : { borderColor: 'var(--border-subtle)' }
                    }
                  >
                    {oem}
                  </button>
                ))}
              </div>
              <p className="text-xs leading-relaxed opacity-85">
                {selectedOem === 'samsung' &&
                  t(
                    'Samsung OneUI: ไปที่ Settings → Apps → Kōhī → Battery → เลือก "Unrestricted (ไม่จำกัด)" และปิด Put unused apps to sleep สำหรับ Kōhī',
                    'Samsung OneUI: Settings → Apps → Kōhī → Battery → Select "Unrestricted" and exclude Kōhī from Deep Sleeping apps.'
                  )}
                {selectedOem === 'xiaomi' &&
                  t(
                    'Xiaomi HyperOS / MIUI: ไปที่ Settings → Apps → Manage apps → Kōhī → เปิด "Autostart" และตั้งค่า Battery saver เป็น "No restrictions"',
                    'Xiaomi HyperOS / MIUI: Enable "Autostart" in App Info and set Battery Saver to "No restrictions".'
                  )}
                {selectedOem === 'oppo' &&
                  t(
                    'OPPO ColorOS / Realme: ไปที่ Settings → Battery → More settings → Optimize battery use → Kōhī → เลือก "Don\'t optimize"',
                    'OPPO ColorOS: Enable "Allow background activity" and lock Kōhī in Recent Apps.'
                  )}
                {selectedOem === 'vivo' &&
                  t(
                    'Vivo FuntouchOS: ไปที่ Settings → Battery → Background power consumption management → Kōhī → เลือก "High background power usage"',
                    'Vivo FuntouchOS: Enable "High background power usage" and Autostart in iManager.'
                  )}
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* iOS WidgetKit, Share Extension & App Intents Preview */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* WidgetKit Preview */}
          <div
            className="rounded-3xl border p-6 space-y-4"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-accent)',
            }}
          >
            <div className="flex items-center gap-2 text-sm font-bold">
              <Smartphone className="w-4 h-4" style={{ color: 'var(--accent-secondary)' }} />
              <span>iOS Home Screen Widget (WidgetKit)</span>
            </div>
            <p className="text-xs opacity-80">
              {t(
                'ใช้สีพื้นหลัง milkCream ตัวอักษร espresso และแสดงยอดวันนี้พร้อมปุ่มลัดบันทึกด่วน',
                'Interactive Medium Widget styled with milkCream surface, espresso typography, and deep links.'
              )}
            </p>
            {/* Simulated iOS Medium Widget */}
            <div
              className="p-4 rounded-2xl border shadow-md space-y-3"
              style={{
                backgroundColor: '#FFF1DE',
                borderColor: '#D7B896',
                color: '#56301D',
              }}
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span>Kōhī · จิบกาแฟ</span>
                <span className="font-mono-tabular opacity-75">20 ต.ค. 2569</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[10px] opacity-75">รายรับวันนี้</div>
                  <div className="text-sm font-bold font-mono-tabular" style={{ color: '#2E7D5B' }}>
                    +฿0.00 ↗
                  </div>
                </div>
                <div>
                  <div className="text-[10px] opacity-75">รายจ่ายวันนี้</div>
                  <div className="text-sm font-bold font-mono-tabular" style={{ color: '#B3402F' }}>
                    -฿294.00 ↘
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div
                  className="py-1.5 rounded-lg text-center text-xs font-bold"
                  style={{ backgroundColor: '#56301D', color: '#FFF1DE' }}
                >
                  + จ่ายด่วน
                </div>
                <div
                  className="py-1.5 rounded-lg text-center text-xs font-bold border"
                  style={{ borderColor: '#56301D', color: '#56301D' }}
                >
                  สแกนสลิป
                </div>
              </div>
            </div>
          </div>

          {/* Share Extension Flow */}
          <div
            className="rounded-3xl border p-6 space-y-4"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex items-center gap-2 text-sm font-bold">
              <Share2 className="w-4 h-4" style={{ color: 'var(--accent-secondary)' }} />
              <span>iOS Share Extension (แชร์สลิปจากแอปธนาคาร)</span>
            </div>
            <ol className="text-xs space-y-2.5 opacity-85 list-decimal list-inside leading-relaxed">
              <li>
                {t(
                  'เมื่อโอนเงินใน K PLUS หรือ SCB Easy เสร็จ แตะปุ่ม "แชร์สลิป (Share)"',
                  'After transferring in K PLUS or SCB Easy, tap "Share Slip".'
                )}
              </li>
              <li>
                {t(
                  'เลือกไอคอนแอป "Kōhī (จิบกาแฟ)" จากเมนู Share Sheet ของ iOS',
                  'Select "Kōhī" directly from the iOS Share Sheet.'
                )}
              </li>
              <li>
                {t(
                  'ShareViewController.swift จะย่อขนาดรูปไม่ให้เกินลิมิต RAM 120MB อ่าน OCR ภาษาไทยด้วย Apple Vision และบันทึกเข้า App Group ที่เข้ารหัสทันทีโดยไม่ต้องเซฟรูปลงอัลบั้มก่อน',
                  'Downsamples image under the 120MB extension limit, runs Apple Vision Thai OCR, and writes to the encrypted App Group container.'
                )}
              </li>
            </ol>
          </div>

          {/* App Intents / Back Tap / Action Button */}
          <div
            className="rounded-3xl border p-6 space-y-4"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex items-center gap-2 text-sm font-bold">
              <Zap className="w-4 h-4" style={{ color: 'var(--accent-secondary)' }} />
              <span>Shortcuts, Back Tap & Action Button</span>
            </div>
            <p className="text-xs opacity-85 leading-relaxed">
              {t(
                'ผูกคำสั่งลัด App Intents ("Scan Latest Slip" หรือ "Quick Expense") เข้ากับปุ่ม Action Button บน iPhone หรือเคาะหลังเครื่อง 2 ครั้ง (Back Tap) เพื่อสแกนสลิปล่าสุดได้ในเสี้ยววินาที',
                'Bind Kōhī App Intents ("Scan Latest Slip", "Add Coffee Expense") to iPhone Action Button, Back Tap, Siri, or AssistiveTouch.'
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
