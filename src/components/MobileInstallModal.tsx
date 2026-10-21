import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileCode,
  QrCode,
  Share,
  Smartphone,
  Terminal,
  X,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  downloadOneClickApkBuilderScript,
  downloadStandaloneOfflineMobileHtml,
} from '../utils/mobileInstallerExporter';
import { LocaleCode } from '../theme/appColors';
import { KohiMascotIcon } from './KohiMascotIcon';

interface MobileInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: LocaleCode;
  onDownloadFlutterBundle: () => void;
}

export const MobileInstallModal: React.FC<MobileInstallModalProps> = ({
  isOpen,
  onClose,
  locale,
  onDownloadFlutterBundle,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [downloadedNotice, setDownloadedNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const t = (th: string, en: string) => (locale === 'th' ? th : en);
  const currentAppUrl = window.location.origin;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div
        className="w-full max-w-2xl rounded-t-3xl sm:rounded-3xl border overflow-hidden shadow-2xl max-h-[92vh] flex flex-col"
        style={{
          backgroundColor: 'var(--bg-canvas)',
          borderColor: 'var(--border-accent)',
          color: 'var(--text-primary)',
        }}
      >
        {/* Modal Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-3">
            <KohiMascotIcon size={36} />
            <div>
              <h2 className="text-base font-extrabold">
                {t(
                  'ติดตั้งแอป Kōhī (จิบกาแฟ) ลงมือถือ iOS & Android',
                  'Install Kōhī App on iOS & Android'
                )}
              </h2>
              <p className="text-xs opacity-75">
                {t(
                  'เลือกติดตั้งแบบแอปเต็มจอทันที (PWA) หรือดาวน์โหลดตัวสร้างไฟล์ติดตั้ง .APK / iOS',
                  'Install directly to Home Screen or download the 1-Click Native APK/iOS Installer'
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center cursor-pointer hover:opacity-80"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {downloadedNotice && (
            <div
              className="p-3.5 rounded-2xl border flex items-center gap-2.5 text-xs font-bold"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--semantic-income)',
              }}
            >
              <CheckCircle2
                className="w-4 h-4 shrink-0"
                style={{ color: 'var(--semantic-income)' }}
              />
              <span>{downloadedNotice}</span>
            </div>
          )}

          {/* OPTION 1: Direct Mobile Install (PWA + Standalone Installer File) */}
          <div
            className="rounded-3xl border-2 p-5 space-y-4"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-accent)',
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="text-sm font-extrabold flex items-center gap-2">
                  <Smartphone
                    className="w-4 h-4"
                    style={{ color: 'var(--accent-secondary)' }}
                  />
                  <span>
                    {t(
                      'วิธีที่ 1: ติดตั้งลงหน้าจอมือถือทันที (ไม่ต้องใช้คอมพิวเตอร์)',
                      'Option 1: Direct Mobile Home Screen Install (No PC Required)'
                    )}
                  </span>
                </div>
                <p className="text-xs opacity-80 leading-relaxed">
                  {t(
                    'ติดตั้งไอคอน Kōhī ลงบนหน้าจอโฮมของ iPhone (iOS) หรือ Android เพื่อเปิดใช้งานแบบเต็มจอ (Standalone App) และทำงานออฟไลน์ได้ทันที',
                    'Adds the Kōhī icon to your iOS or Android Home Screen for full-screen standalone offline use.'
                  )}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Native Browser PWA Install Prompt Button (if supported) or File Installer */}
              {isInstallable && !isInstalled ? (
                <button
                  onClick={async () => {
                    const ok = await install();
                    if (ok) {
                      setDownloadedNotice(
                        t(
                          'ติดตั้งแอป Kōhī ลงบนอุปกรณ์ของคุณเรียบร้อยแล้ว!',
                          'Kōhī App installed successfully!'
                        )
                      );
                    }
                  }}
                  className="min-h-[46px] px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: 'var(--accent-on-primary)',
                  }}
                >
                  <Download className="w-4 h-4" />
                  {t(
                    'กดติดตั้งแอปลงเครื่องทันที (Install App)',
                    'Install App to Device Now'
                  )}
                </button>
              ) : (
                <button
                  onClick={() => {
                    downloadStandaloneOfflineMobileHtml();
                    setDownloadedNotice(
                      t(
                        'ดาวน์โหลดไฟล์ Kohi_Mobile_App_Installer.html แล้ว! เปิดไฟล์นี้บนมือถือเพื่อเพิ่มลงหน้าจอโฮมได้เลย',
                        'Downloaded Kohi_Mobile_App_Installer.html!'
                      )
                    );
                  }}
                  className="min-h-[46px] px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: 'var(--accent-on-primary)',
                  }}
                >
                  <Download className="w-4 h-4" />
                  {t(
                    'ดาวน์โหลดไฟล์ตัวติดตั้งลงมือถือ (.html)',
                    'Download Mobile Installer File (.html)'
                  )}
                </button>
              )}

              {/* Copy Mobile Link Button */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(currentAppUrl);
                  setDownloadedNotice(
                    t(
                      'คัดลอกลิงก์แอปแล้ว! ส่งเข้า LINE หรือเปิดใน Safari / Chrome บนมือถือแล้วกด Add to Home Screen ได้เลย',
                      'Copied app link! Open in mobile Safari or Chrome to Add to Home Screen.'
                    )
                  );
                }}
                className="min-h-[46px] px-4 py-2.5 rounded-2xl text-xs font-bold border flex items-center justify-center gap-2 cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderColor: 'var(--border-accent)',
                }}
              >
                <QrCode className="w-4 h-4" />
                {t(
                  'คัดลอกลิงก์ไปเปิดบนมือถือ',
                  'Copy Link for Mobile Browser'
                )}
              </button>
            </div>

            {/* Step-by-step iOS & Android instructions */}
            <div
              className="p-3.5 rounded-2xl border grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs"
              style={{
                backgroundColor: 'var(--bg-canvas)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Share className="w-3.5 h-3.5" />
                  <span>สำหรับ iPhone / iOS (Safari):</span>
                </div>
                <p className="opacity-80 leading-relaxed text-[11px]">
                  1. เปิดลิงก์นี้ใน <strong>Safari</strong> บน iPhone
                  <br />
                  2. แตะปุ่ม <strong>แชร์ (Share ⬆️)</strong> ด้านล่าง
                  <br />
                  3. เลือก <strong>"เพิ่มไปยังหน้าจอโฮม (Add to Home Screen)"</strong>
                </p>
              </div>
              <div className="space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>สำหรับ Android (Chrome):</span>
                </div>
                <p className="opacity-80 leading-relaxed text-[11px]">
                  1. เปิดลิงก์นี้ใน <strong>Chrome</strong> บนมือถือ Android
                  <br />
                  2. แตะปุ่มเมนู <strong>⋮ (มุมขวาบน)</strong>
                  <br />
                  3. เลือก <strong>"ติดตั้งแอป (Install App)"</strong>
                </p>
              </div>
            </div>
          </div>

          {/* OPTION 2: One-Click Native Android APK & iOS Flutter Builder Script */}
          <div
            className="rounded-3xl border p-5 space-y-4"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="space-y-1">
              <div className="text-sm font-extrabold flex items-center gap-2">
                <Terminal
                  className="w-4 h-4"
                  style={{ color: 'var(--accent-secondary)' }}
                />
                <span>
                  {t(
                    'วิธีที่ 2: ดาวน์โหลดตัวสร้างไฟล์ .APK (Android) & iOS แท้ (Flutter + Kotlin + Swift)',
                    'Option 2: Download 1-Click Native Android (.APK) & iOS Builder'
                  )}
                </span>
              </div>
              <p className="text-xs opacity-80 leading-relaxed">
                {t(
                  'สำหรับนำไปสร้างไฟล์ app-release.apk เพื่อเปิดใช้งานฟีเจอร์ระดับลึกของระบบปฏิบัติการ เช่น ดักอ่านแจ้งเตือน K PLUS / SCB อัตโนมัติ (NotificationListenerService) และ iOS Home Screen WidgetKit',
                  'Generates the complete native Flutter project and compiles app-release.apk with Android NotificationListenerService and iOS WidgetKit.'
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  downloadOneClickApkBuilderScript();
                  setDownloadedNotice(
                    t(
                      'ดาวน์โหลดสคริปต์ build_kohi_mobile_app.sh แล้ว! รันคำสั่ง bash build_kohi_mobile_app.sh เพื่อสร้างไฟล์ .APK ได้ทันที',
                      'Downloaded build_kohi_mobile_app.sh! Run it to auto-build app-release.apk.'
                    )
                  );
                }}
                className="min-h-[46px] px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--accent-on-primary)',
                }}
              >
                <Download className="w-4 h-4" />
                {t(
                  'ดาวน์โหลดตัวสร้างไฟล์ .APK อัตโนมัติ (.sh)',
                  'Download 1-Click APK Builder (.sh)'
                )}
              </button>

              <button
                onClick={() => {
                  onDownloadFlutterBundle();
                  setDownloadedNotice(
                    t(
                      'ดาวน์โหลดซอร์สโค้ดทั้งหมด (kohi_flutter_ios_android_source_bundle.txt) เรียบร้อยแล้ว!',
                      'Downloaded full Flutter/Kotlin/Swift source bundle!'
                    )
                  );
                }}
                className="min-h-[46px] px-4 py-2.5 rounded-2xl text-xs font-bold border flex items-center justify-center gap-2 cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <FileCode className="w-4 h-4" />
                {t(
                  'ดาวน์โหลดซอร์สโค้ดทั้งหมด (.txt)',
                  'Download Full Source Code (.txt)'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
