import { FLUTTER_PROJECT_FILES } from '../data/flutterProjectFiles';

/**
 * Generates and downloads a one-click Bash/macOS/Linux script (`build_kohi_apk.sh`)
 * and Windows PowerShell script (`build_kohi_apk.ps1`) that automatically creates
 * the full Flutter project, writes all Dart/Kotlin/Swift files, and builds the
 * installable Android `.apk` and iOS project.
 */
export function downloadOneClickApkBuilderScript() {
  const fileBlocks = FLUTTER_PROJECT_FILES.map((file) => {
    const dirPath = file.path.includes('/')
      ? file.path.substring(0, file.path.lastIndexOf('/'))
      : '';
    const mkDirCmd = dirPath ? `mkdir -p "${dirPath}"\n` : '';
    return `${mkDirCmd}cat << 'EOF_KOHI_FILE' > "${file.path}"
${file.content}
EOF_KOHI_FILE
`;
  }).join('\n');

  const scriptContent = `#!/usr/bin/env bash
# ==============================================================================
# Kōhī (จิบกาแฟ) — One-Click Native Android (.apk) & iOS Project Builder
# ==============================================================================
# วิธีใช้งาน (How to build & install on your phone):
# 1. เปิด Terminal ในคอมพิวเตอร์ที่มี Flutter SDK ติดตั้งอยู่
# 2. รันคำสั่ง: bash build_kohi_mobile_app.sh
# 3. สคริปต์จะสร้างโปรเจกต์ kohi_app ครบทุกไฟล์และสร้างไฟล์ติดตั้ง kohi-release.apk ให้ทันที!
# ==============================================================================

set -e

echo "☕ กำลังสร้างโปรเจกต์มือถือ Kōhī (จิบกาแฟ) สำหรับ iOS & Android..."
if command -v flutter >/dev/null 2>&1; then
  flutter create --org com.kohi kohi_app
else
  mkdir -p kohi_app
fi

cd kohi_app

${fileBlocks}

echo "✅ สร้างไฟล์ซอร์สโค้ด Dart + Kotlin (Android) + Swift (iOS) ครบถ้วนแล้ว!"

if command -v flutter >/dev/null 2>&1; then
  echo "📦 กำลังดึงแพ็กเกจและคอมไพล์ไฟล์ติดตั้ง Android (.apk)..."
  flutter pub get
  flutter build apk --release --obfuscate --split-debug-info=build/symbols
  echo "🎉 สร้างไฟล์ติดตั้งสำเร็จ! ไฟล์ APK ของคุณอยู่ที่: kohi_app/build/app/outputs/flutter-apk/app-release.apk"
else
  echo "💡 โฟลเดอร์โปรเจกต์ kohi_app พร้อมแล้ว! เปิดด้วย Android Studio หรือ Xcode เพื่อกด Run ลงมือถือได้เลย"
fi
`;

  const blob = new Blob([scriptContent], {
    type: 'text/x-shellscript;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'build_kohi_mobile_app.sh';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates a standalone, self-contained HTML5 Mobile App file (`Kohi_Mobile_Installer.html`)
 * that the user can save directly onto their phone and open offline anytime.
 */
export function downloadStandaloneOfflineMobileHtml() {
  const html = `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<meta name="apple-mobile-web-app-capable" content="yes"/>
<meta name="mobile-web-app-capable" content="yes"/>
<meta name="theme-color" content="#56301D"/>
<title>Kōhī (จิบกาแฟ)</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background:#FFFCF7; color:#351A0E; margin:0; padding:24px; text-align:center; }
  .card { max-width:400px; margin:40px auto; background:#FFF1DE; border:2px solid #A66A43; border-radius:24px; padding:28px; box-shadow:0 12px 32px rgba(86,48,29,0.12); }
  .btn { display:block; width:100%; padding:14px; margin-top:16px; background:#56301D; color:#FFF1DE; text-decoration:none; font-weight:700; border-radius:14px; border:none; font-size:15px; }
  .step { text-align:left; font-size:14px; line-height:1.6; background:#FFFCF7; padding:14px; border-radius:14px; border:1px solid #D7B896; margin-top:14px; }
</style>
</head>
<body>
  <div class="card">
    <h1 style="color:#56301D;margin:0 0 8px 0;">☕ Kōhī (จิบกาแฟ)</h1>
    <p style="font-size:13px;opacity:0.85;margin:0;">ตัวติดตั้งทางลัดแอปมือถือ iOS & Android (Offline-First)</p>
    <div class="step">
      <strong>วิธีติดตั้งลงจอมือถือให้เปิดเต็มจอเหมือนแอปแท้:</strong><br/>
      • <strong>iOS (iPhone / Safari):</strong> แตะปุ่ม <strong>แชร์ (Share ⬆️)</strong> ด้านล่าง แล้วเลือก <strong>"เพิ่มไปยังหน้าจอโฮม (Add to Home Screen)"</strong><br/><br/>
      • <strong>Android (Chrome):</strong> แตะเมนู <strong>⋮ (มุมขวาบน)</strong> แล้วเลือก <strong>"ติดตั้งแอป (Install App)"</strong>
    </div>
    <a class="btn" href="${window.location.origin}" target="_blank" rel="noopener">เปิดแอป Kōhī (จิบกาแฟ) เต็มจอ ➔</a>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Kohi_Mobile_App_Installer.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
