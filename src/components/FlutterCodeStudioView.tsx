import React, { useState } from 'react';
import {
  Check,
  Code2,
  Copy,
  Download,
  FileCode,
  FolderTree,
  Terminal,
} from 'lucide-react';
import { FLUTTER_PROJECT_FILES, FlutterSourceFile } from '../data/flutterProjectFiles';
import { LocaleCode } from '../theme/appColors';

interface FlutterCodeStudioViewProps {
  locale: LocaleCode;
}

export const FlutterCodeStudioView: React.FC<FlutterCodeStudioViewProps> = ({
  locale,
}) => {
  const [selectedFile, setSelectedFile] = useState<FlutterSourceFile>(
    FLUTTER_PROJECT_FILES[0]
  );
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const t = (th: string, en: string) => (locale === 'th' ? th : en);

  const handleCopyFile = (file: FlutterSourceFile) => {
    navigator.clipboard.writeText(file.content);
    setCopiedPath(file.path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const handleDownloadFullBundle = () => {
    const bundleText = FLUTTER_PROJECT_FILES.map(
      (f) =>
        `================================================================================\nFILE: ${f.path}\nDESCRIPTION: ${f.descriptionEn}\n================================================================================\n\n${f.content}\n\n`
    ).join('\n');

    const blob = new Blob([bundleText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kohi_flutter_ios_android_full_source_bundle.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadSingleFile = (file: FlutterSourceFile) => {
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = file.path.split('/').pop() || 'source.txt';
    a.download = baseName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Studio Header & Bundle Downloader */}
      <div
        className="rounded-3xl border p-6 flex flex-wrap items-center justify-between gap-4"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-accent)',
        }}
      >
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2 text-base font-bold">
            <Code2 className="w-5 h-5" style={{ color: 'var(--accent-secondary)' }} />
            <span>
              {t(
                'ซอร์สโค้ดฉบับเต็ม Flutter + Android (Kotlin) + iOS (Swift) สำหรับติดตั้งลงมือถือ',
                'Complete Flutter + Kotlin + Swift Source Codebase for Mobile Installation'
              )}
            </span>
          </div>
          <p className="text-xs opacity-80 leading-relaxed">
            {t(
              'ประกอบด้วยไฟล์ตั้งค่าสีกลาง (app_colors.dart), ฐานข้อมูลเข้ารหัส SQLCipher (app_database.dart), ตัวอ่านสลิปและ PromptPay QR ใน Background Isolate, บริการอ่านแจ้งเตือน Android (KohiNotificationListenerService.kt) และ iOS WidgetKit / Share Extension พร้อมคู่มือสั่งรันลงมือถือจริง',
              'Includes app_colors.dart tokens, Drift SQLCipher database, Isolate slip/QR parsers, Android NotificationListenerService.kt, iOS WidgetKit & Share Extension, unit tests, and build steps.'
            )}
          </p>
        </div>

        <button
          onClick={handleDownloadFullBundle}
          className="min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer shrink-0"
          style={{
            backgroundColor: 'var(--accent-primary)',
            color: 'var(--accent-on-primary)',
          }}
        >
          <Download className="w-4 h-4" />
          {t(
            'ดาวน์โหลดซอร์สโค้ดทั้งหมด (Full Project Bundle)',
            'Download Full Flutter Project Bundle'
          )}
        </button>
      </div>

      {/* Main Split Code Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left File Tree */}
        <div
          className="lg:col-span-4 rounded-3xl border p-5 space-y-4"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-2 text-sm font-bold pb-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <FolderTree className="w-4 h-4" style={{ color: 'var(--accent-secondary)' }} />
            <span>{t('โครงสร้างไฟล์โปรเจกต์ (Project Files)', 'Project File Explorer')}</span>
          </div>

          <div className="space-y-2">
            {FLUTTER_PROJECT_FILES.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className="w-full text-left p-3 rounded-xl border transition-all cursor-pointer space-y-1"
                  style={
                    isSelected
                      ? {
                          backgroundColor: 'var(--accent-primary)',
                          color: 'var(--accent-on-primary)',
                          borderColor: 'var(--accent-primary)',
                        }
                      : {
                          backgroundColor: 'var(--bg-canvas)',
                          borderColor: 'var(--border-subtle)',
                        }
                  }
                >
                  <div className="flex items-center justify-between text-[11px] opacity-80">
                    <span>{file.category}</span>
                    <span className="font-mono-tabular uppercase">{file.language}</span>
                  </div>
                  <div className="font-mono-tabular text-xs font-bold break-all">
                    {file.path}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Code Viewer */}
        <div
          className="lg:col-span-8 rounded-3xl border overflow-hidden flex flex-col"
          style={{
            backgroundColor: 'var(--bg-canvas)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          {/* File Header Bar */}
          <div
            className="p-4 border-b flex flex-wrap items-center justify-between gap-3"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="space-y-0.5">
              <div className="font-mono-tabular text-sm font-bold flex items-center gap-2">
                <FileCode className="w-4 h-4" style={{ color: 'var(--accent-secondary)' }} />
                {selectedFile.path}
              </div>
              <div className="text-xs opacity-80">
                {locale === 'th'
                  ? selectedFile.descriptionTh
                  : selectedFile.descriptionEn}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyFile(selectedFile)}
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                {copiedPath === selectedFile.path ? (
                  <>
                    <Check className="w-3.5 h-3.5" style={{ color: 'var(--semantic-income)' }} />
                    {t('คัดลอกแล้ว', 'Copied')}
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    {t('คัดลอกโค้ด', 'Copy Code')}
                  </>
                )}
              </button>
              <button
                onClick={() => handleDownloadSingleFile(selectedFile)}
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--accent-on-primary)',
                }}
              >
                <Download className="w-3.5 h-3.5" />
                {t('ดาวน์โหลดไฟล์นี้', 'Download File')}
              </button>
            </div>
          </div>

          {/* Code Content Pre */}
          <pre
            className="p-5 text-xs font-mono-tabular overflow-x-auto leading-relaxed flex-1 max-h-[600px]"
            style={{
              backgroundColor: '#1E110A',
              color: '#FFF1DE',
            }}
          >
            <code>{selectedFile.content}</code>
          </pre>
        </div>
      </div>

      {/* Quick Terminal Commands Banner */}
      <div
        className="rounded-3xl border p-5 flex flex-wrap items-center justify-between gap-4 text-xs"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <Terminal className="w-4 h-4" style={{ color: 'var(--accent-secondary)' }} />
          <span>
            {t(
              'คำสั่งคอมไพล์และติดตั้งลงมือถือจริง (เปิด Impeller + Obfuscation):',
              'Build & Install on Connected Mobile Device (Impeller + Dart Obfuscation):'
            )}
          </span>
        </div>
        <code
          className="px-3 py-1.5 rounded-lg font-mono-tabular"
          style={{ backgroundColor: '#1E110A', color: '#FFF1DE' }}
        >
          flutter run --release --enable-impeller --obfuscate --split-debug-info=build/symbols
        </code>
      </div>
    </div>
  );
};
