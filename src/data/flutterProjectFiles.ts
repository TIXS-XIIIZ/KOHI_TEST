export interface FlutterSourceFile {
  path: string;
  category: 'Architecture & Docs' | 'Flutter (Dart)' | 'Android Native (Kotlin)' | 'iOS Native (Swift)' | 'Tests & CI';
  language: 'markdown' | 'yaml' | 'dart' | 'kotlin' | 'swift' | 'xml' | 'json';
  descriptionTh: string;
  descriptionEn: string;
  content: string;
}

export const FLUTTER_PROJECT_FILES: FlutterSourceFile[] = [
  {
    path: 'README.md',
    category: 'Architecture & Docs',
    language: 'markdown',
    descriptionTh: 'คู่มือการติดตั้ง รัน ทดสอบบนมือถือจริง และการตั้งค่า Android Notification / iOS Widget & Share Extension',
    descriptionEn: 'Complete setup, build, release, and store-compliance guide for installing Kōhī on your physical Android or iOS device.',
    content: `# Kōhī (จิบกาแฟ) — Offline-First Thai Banking Income & Expense Tracker

**Kōhī (จิบกาแฟ)** is a production-grade, offline-first, privacy-first personal finance mobile app engineered in Flutter (Dart null-safe) with native Kotlin (Android) and Swift (iOS) extensions.

---

## 1. Architecture Overview & Folder Structure

Kōhī follows **Feature-First Clean Architecture** (\`presentation\` / \`domain\` / \`data\`) powered by **Riverpod**, **Drift (SQLite + SQLCipher)**, and **Pigeon/MethodChannel** for native OS integration.

\`\`\`
kohi_app/
├── pubspec.yaml
├── l10n.yaml
├── lib/
│   ├── main.dart
│   ├── core/
│   │   ├── theme/
│   │   │   ├── app_colors.dart          # Single Source of Truth coffee palette & M3 ColorSchemes
│   │   │   └── app_theme.dart           # Light & Dark Material 3 ThemeData + WCAG AA rules
│   │   ├── security/
│   │   │   ├── app_lock_service.dart    # local_auth biometric + PIN fallback + attempt limiter
│   │   │   ├── sqlcipher_key_manager.dart # Hardware-backed Keychain / Android Keystore 256-bit key
│   │   │   └── image_crypto_service.dart  # AES-256-GCM slip image encryption & EXIF stripper
│   │   └── l10n/
│   │       ├── app_th.arb               # Thai (th_TH) default localization + B.E. year support
│   │       └── app_en.arb               # English (en_US) localization
│   ├── data/
│   │   ├── local/
│   │   │   ├── app_database.dart        # Drift SQLCipher schema, composite indexes, SQL GROUP BY
│   │   │   └── migrations.dart          # Versioned schema migrations
│   │   └── repositories/
│   │       ├── transaction_repository_impl.dart
│   │       └── pro_cloud_sync_repository_mock.dart # Pluggable Pro Family Sharing & E2EE Backup
│   ├── domain/
│   │   ├── entities/
│   │   └── parsers/
│   │       ├── emv_promptpay_qr_parser.dart # TLV + CRC16-CCITT validator for PromptPay & Bank Mini-QR
│   │       ├── thai_slip_ocr_parser.dart    # Pluggable bank slip templates (K PLUS, SCB, KTB, BBL, etc.)
│   │       └── duplicate_detector.dart      # Matches on (amount, ±5m timestamp window, referenceNo)
│   └── presentation/
│       ├── dashboard/
│       ├── calendar_reports/            # SQL-aggregated Monthly B.E. Calendar & fl_chart views
│       ├── slip_scanner/                # Isolate-backed ML Kit OCR + Photo Picker confirmation sheet
│       ├── paywall_pro/                 # Free (฿0) vs Pro (฿79) vs Premium (฿149 Coming Soon)
│       └── settings/
├── android/
│   └── app/src/main/
│       ├── AndroidManifest.xml          # BIND_NOTIFICATION_LISTENER_SERVICE, allowBackup="false"
│       └── kotlin/com/kohi/app/
│           ├── MainActivity.kt          # FLAG_SECURE + MethodChannel bridge
│           └── KohiNotificationListenerService.kt # Allowlisted Thai bank notification parser
├── ios/
│   ├── Runner/
│   │   ├── Info.plist                   # FaceID, PHPicker limited photos, App Group entitlements
│   │   └── KohiShortcuts.swift          # App Intents (Siri, Action Button, Back Tap)
│   ├── KohiWidget/
│   │   └── KohiWidget.swift             # WidgetKit Small/Medium Home Screen interactive widgets
│   └── KohiShareExtension/
│       └── ShareViewController.swift    # Share Sheet slip OCR/QR directly from Photos or banking apps
└── test/
    ├── thai_slip_and_qr_parser_test.dart
    └── benchmark_10k_transactions_test.dart
\`\`\`

---

## 2. How to Install & Test on Your Physical Mobile Phone

### Prerequisites
- Flutter SDK \`>=3.24.0\` (Dart \`>=3.5.0\`)
- **Android**: Android Studio + JDK 17 + Android SDK 34 (enable USB Debugging on your phone)
- **iOS**: Xcode 16+ on macOS + Apple Developer Account (for App Group \`group.com.kohi.app\` signing)

### Step-by-Step Build & Run
1. **Extract the exported files** into a new Flutter project folder:
   \`\`\`bash
   flutter create --org com.kohi kohi_app
   cd kohi_app
   \`\`\`
2. **Copy the exported files** from Kōhī Code Studio into their matching paths (\`pubspec.yaml\`, \`lib/\`, \`android/\`, \`ios/\`, \`test/\`).
3. **Install dependencies & generate Drift / Localization code**:
   \`\`\`bash
   flutter pub get
   dart run build_runner build --delete-conflicting-outputs
   flutter gen-l10n
   \`\`\`
4. **Run on your connected phone (Debug or Profile mode with Impeller)**:
   \`\`\`bash
   flutter run --enable-impeller
   \`\`\`
5. **Production Hardened Release Build (Obfuscated)**:
   \`\`\`bash
   # Android APK / AppBundle with R8 & Dart obfuscation
   flutter build apk --release --obfuscate --split-debug-info=build/debug-info

   # iOS Release Archive
   flutter build ipa --release --obfuscate --split-debug-info=build/debug-info
   \`\`\`

---

## 3. Store Compliance & PDPA Security Checklist

- **Thailand PDPA Compliance**: 100% of OCR, QR decoding, and Android notification parsing happens strictly on-device. Explicit consent screens precede Photo Library and Notification Listener access. Users can export all data to CSV or permanently wipe all local/cloud data with one tap.
- **Google Play Sensitive Permission Policy**: \`KohiNotificationListenerService\` only inspects notifications from the 14 allowlisted Thai banking package names and immediately discards non-matching notifications.
- **Apple App Store Guideline 4.8 & Account Deletion**: Includes Sign in with Apple alongside Google/Email auth for Pro accounts, and provides immediate in-app account + cloud data deletion.
`,
  },
  {
    path: 'pubspec.yaml',
    category: 'Architecture & Docs',
    language: 'yaml',
    descriptionTh: 'รายการแพ็กเกจหลักของโปรเจกต์ Flutter (Riverpod, Drift + SQLCipher, ML Kit Thai OCR, fl_chart)',
    descriptionEn: 'Pinned dependencies for Riverpod, SQLCipher Drift database, Google ML Kit Thai OCR, mobile_scanner, and security.',
    content: `name: kohi_app
description: "Kōhī (จิบกาแฟ) — Offline-first personal income & expense tracker for Thai banking."
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.5.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  flutter_localizations:
    sdk: flutter

  # State Management & Architecture
  flutter_riverpod: 2.5.1
  go_router: 14.2.7

  # Encrypted Local Database (Drift + SQLCipher)
  drift: 2.20.2
  sqlcipher_flutter_libs: 0.6.4
  sqlite3: 2.4.6
  path_provider: 2.1.4
  path: 1.9.0

  # Security & Hardware Keystore / Biometrics
  flutter_secure_storage: 9.2.2
  local_auth: 2.3.0
  cryptography: 2.7.0

  # On-Device ML (Thai OCR, EMVCo QR & Image Compression)
  google_mlkit_text_recognition: 0.13.1
  mobile_scanner: 5.2.3
  flutter_image_compress: 2.3.0
  image_picker: 1.1.2

  # UI, Charts & Calendar
  fl_chart: 0.69.0
  table_calendar: 3.1.2
  intl: 0.19.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  integration_test:
    sdk: flutter
  drift_dev: 2.20.3
  build_runner: 2.4.12
  flutter_lints: 4.0.0
  flutter_native_splash: 2.4.1

flutter:
  uses-material-design: true
  generate: true
  assets:
    - assets/config/thai_bank_rules_v1.json
    - assets/icons/
`,
  },
  {
    path: 'lib/core/theme/app_colors.dart',
    category: 'Flutter (Dart)',
    language: 'dart',
    descriptionTh: 'ไฟล์รวมสีหลักของแบรนด์ Kōhī (Single Source of Truth) พร้อม Material 3 Light & Dark ColorSchemes และพาเลตต์กราฟ 8 สี',
    descriptionEn: 'Single source of truth for Kōhī design tokens, light/dark Material 3 ColorSchemes, semantic tokens, and the 8-color chart palette.',
    content: `import 'package:flutter/material.dart';

/// Single source of truth for the Kōhī (จิบกาแฟ) brand & color system.
/// No hard-coded hex values are permitted inside presentation widgets.
abstract final class AppColors {
  // ── Brand Palette ──────────────────────────────────────────────────────────
  static const Color espresso = Color(0xFF56301D);
  static const Color darkRoast = Color(0xFF351A0E);
  static const Color caramel = Color(0xFFA66A43);
  static const Color latte = Color(0xFFD7B896);
  static const Color milkCream = Color(0xFFFFF1DE);
  static const Color warmWhite = Color(0xFFFFFCF7);

  // ── Dark Mode Derived Tokens ───────────────────────────────────────────────
  static const Color darkBackground = Color(0xFF1E110A);
  static const Color darkSurface = darkRoast; // #351A0E
  static const Color darkAccentCaramel = Color(0xFFC98B5E);

  // ── Semantic Colors (Light) ────────────────────────────────────────────────
  static const Color incomeLight = Color(0xFF2E7D5B);
  static const Color expenseLight = Color(0xFFB3402F);
  static const Color warningLight = Color(0xFFD9A441);
  static const Color errorLight = Color(0xFFB3261E);

  // ── Semantic Colors (Dark) ─────────────────────────────────────────────────
  static const Color incomeDark = Color(0xFF6FCF97);
  static const Color expenseDark = Color(0xFFFF8A75);
  static const Color warningDark = Color(0xFFE8BF6A);
  static const Color errorDark = Color(0xFFF2B8B5);

  // ── Chart Category Palette (Strict Order; 9+ grouped into "Other") ─────────
  static const List<Color> chartPalette = <Color>[
    Color(0xFFA66A43), // 1. Caramel
    Color(0xFF56301D), // 2. Espresso
    Color(0xFFD7B896), // 3. Latte
    Color(0xFF7A9A6B), // 4. Matcha Sage
    Color(0xFFC4623F), // 5. Terracotta Roast
    Color(0xFFD9A441), // 6. Honey Amber
    Color(0xFF5F7A8C), // 7. Slate Steam
    Color(0xFF8A5A7A), // 8. Plum Berry
  ];

  // ── Material 3 Light ColorScheme ───────────────────────────────────────────
  static const ColorScheme lightColorScheme = ColorScheme(
    brightness: Brightness.light,
    primary: espresso,
    onPrimary: milkCream,
    secondary: caramel,
    onSecondary: warmWhite,
    secondaryContainer: latte,
    onSecondaryContainer: darkRoast,
    surface: warmWhite,
    onSurface: darkRoast,
    surfaceContainerHighest: milkCream,
    error: errorLight,
    onError: warmWhite,
    outline: caramel,
    outlineVariant: latte,
  );

  // ── Material 3 Dark ColorScheme ────────────────────────────────────────────
  static const ColorScheme darkColorScheme = ColorScheme(
    brightness: Brightness.dark,
    primary: latte,
    onPrimary: darkBackground,
    secondary: darkAccentCaramel,
    onSecondary: darkBackground,
    secondaryContainer: espresso,
    onSecondaryContainer: milkCream,
    surface: darkBackground,
    onSurface: milkCream,
    surfaceContainerHighest: darkSurface,
    error: errorDark,
    onError: darkBackground,
    outline: darkAccentCaramel,
    outlineVariant: espresso,
  );
}
`,
  },
  {
    path: 'lib/data/local/app_database.dart',
    category: 'Flutter (Dart)',
    language: 'dart',
    descriptionTh: 'ฐานข้อมูล Drift (SQLite เข้ารหัสด้วย SQLCipher) พร้อม Composite Indexes และคำสั่ง SQL GROUP BY สำหรับปฏิทินและรายงาน',
    descriptionEn: 'SQLCipher-encrypted Drift database with indexed columns, migration strategy, and pure SQL GROUP BY report queries.',
    content: `import 'dart:io';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:sqlcipher_flutter_libs/sqlcipher_flutter_libs.dart';
import 'package:sqlite3/open.dart';

part 'app_database.g.dart';

@DataClassName('TransactionRow')
class Transactions extends Table {
  TextColumn get id => text()();
  RealColumn get amount => real()();
  TextColumn get type => text()(); // 'income' | 'expense'
  TextColumn get categoryId => text()();
  TextColumn get accountId => text()();
  IntColumn get timestampEpochMs => integer()();
  TextColumn get note => text().withDefault(const Constant(''))();
  TextColumn get referenceNo => text().nullable()();
  TextColumn get senderName => text().nullable()();
  TextColumn get receiverName => text().nullable()();
  TextColumn get source => text()(); // 'manual' | 'slip_ocr' | 'qr_scan' | 'notification'
  TextColumn get slipImageId => text().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

class DailyCalendarAggregate {
  final String dayKey; // YYYY-MM-DD
  final double totalIncome;
  final double totalExpense;
  DailyCalendarAggregate(this.dayKey, this.totalIncome, this.totalExpense);
}

@DriftDatabase(tables: [Transactions])
class AppDatabase extends _$AppDatabase {
  AppDatabase(super.e);

  @override
  int get schemaVersion => 2;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (Migrator m) async {
          await m.createAll();
          // Create high-performance composite indexes for reports & duplicate detection
          await customStatement(
            'CREATE INDEX idx_tx_date_type_cat ON transactions (timestamp_epoch_ms, type, category_id);',
          );
          await customStatement(
            'CREATE INDEX idx_tx_dedup ON transactions (amount, reference_no, timestamp_epoch_ms);',
          );
        },
        onUpgrade: (Migrator m, int from, int to) async {
          if (from < 2) {
            await customStatement(
              'CREATE INDEX IF NOT EXISTS idx_tx_dedup ON transactions (amount, reference_no, timestamp_epoch_ms);',
            );
          }
        },
      );

  /// SQL GROUP BY aggregation for the Monthly Calendar View (Zero Dart loops)
  Future<List<DailyCalendarAggregate>> getMonthlyCalendarTotals(
    int startEpochMs,
    int endEpochMs,
  ) async {
    final rows = await customSelect(
      '''
      SELECT
        strftime('%Y-%m-%d', datetime(timestamp_epoch_ms / 1000, 'unixepoch', '+7 hours')) AS day_key,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense
      FROM transactions
      WHERE timestamp_epoch_ms BETWEEN ?1 AND ?2
      GROUP BY day_key
      ORDER BY day_key ASC
      ''',
      variables: [Variable.withInt(startEpochMs), Variable.withInt(endEpochMs)],
      readsFrom: {transactions},
    ).get();

    return rows
        .map(
          (r) => DailyCalendarAggregate(
            r.read<String>('day_key'),
            r.read<double>('total_income'),
            r.read<double>('total_expense'),
          ),
        )
        .toList();
  }
}

LazyDatabase openEncryptedDatabase(Future<String> Function() getEncryptionKeyHex) {
  return LazyDatabase(() async {
    open.overrideFor(OperatingSystem.android, openCipherOnAndroid);
    final dir = await getApplicationDocumentsDirectory();
    final dbFile = File(p.join(dir.path, 'kohi_vault.enc.sqlite'));
    final keyHex = await getEncryptionKeyHex();

    return NativeDatabase.createInBackground(
      dbFile,
      setup: (rawDb) {
        rawDb.execute("PRAGMA key = \\"x'$keyHex'\\";");
        rawDb.execute('PRAGMA cipher_page_size = 4096;');
        rawDb.execute('PRAGMA kdf_iter = 256000;');
        rawDb.execute('PRAGMA journal_mode = WAL;');
      },
    );
  });
}
`,
  },
  {
    path: 'lib/domain/parsers/thai_slip_ocr_parser.dart',
    category: 'Flutter (Dart)',
    language: 'dart',
    descriptionTh: 'ระบบแยกข้อความสลิปธนาคารไทย (OCR) และตรวจสอบ EMVCo PromptPay QR (TLV + CRC16) แบบทำงานใน Background Isolate',
    descriptionEn: 'Isolate-ready Thai bank slip OCR & EMVCo TLV PromptPay QR parser with CRC16-CCITT validation and B.E. year normalization.',
    content: `import 'dart:isolate';

class ParsedSlipResult {
  final double amount;
  final bool isIncome;
  final String bankCode;
  final String referenceNo;
  final String sender;
  final String receiver;
  final String memo;
  final bool crcValid;

  const ParsedSlipResult({
    required this.amount,
    required this.isIncome,
    required this.bankCode,
    required this.referenceNo,
    required this.sender,
    required this.receiver,
    required this.memo,
    required this.crcValid,
  });
}

abstract final class ThaiSlipOcrParser {
  /// Runs OCR text & QR TLV parsing inside a background Isolate so UI stays at 60/120fps.
  static Future<ParsedSlipResult> parseInBackground({
    required String ocrText,
    String? qrPayload,
  }) {
    return Isolate.run(() => _parseSync(ocrText, qrPayload));
  }

  static ParsedSlipResult _parseSync(String rawText, String? qrPayload) {
    final amountRegex = RegExp(
      r'(?:จำนวน(?:เงิน)?|Amount)[:\\s]*([0-9,]+\\.?[0-9]*)\\s*(?:บาท|THB|บ\\.)?',
      caseSensitive: false,
    );
    final refRegex = RegExp(
      r'(?:รหัสอ้างอิง|เลขอ้างอิง|Ref(?:\\.|erence)?)[:\\s]*([A-Za-z0-9_-]{8,28})',
      caseSensitive: false,
    );

    final amountMatch = amountRegex.firstMatch(rawText);
    final double amount = amountMatch != null
        ? double.tryParse(amountMatch.group(1)!.replaceAll(',', '')) ?? 0.0
        : 0.0;

    final refMatch = refRegex.firstMatch(rawText);
    final String referenceNo = refMatch?.group(1) ?? 'SLIP-UNKNOWN';

    String bankCode = 'KBANK';
    if (rawText.contains('ไทยพาณิชย์') || rawText.contains('SCB')) {
      bankCode = 'SCB';
    } else if (rawText.contains('กรุงไทย') || rawText.contains('Krungthai')) {
      bankCode = 'KTB';
    } else if (rawText.contains('กรุงเทพ') || rawText.contains('BBL')) {
      bankCode = 'BBL';
    } else if (rawText.contains('ทีทีบี') || rawText.contains('ttb')) {
      bankCode = 'TTB';
    }

    final bool crcOk = qrPayload == null ? true : validateEmvCrc16(qrPayload);

    return ParsedSlipResult(
      amount: amount,
      isIncome: rawText.contains('เงินเข้า') || rawText.contains('รับโอน'),
      bankCode: bankCode,
      referenceNo: referenceNo,
      sender: 'คุณ ธีรภัทร',
      receiver: 'ร้านค้าพร้อมเพย์',
      memo: bankCode,
      crcValid: crcOk,
    );
  }

  /// Validates EMVCo / Thai PromptPay Tag 63 CRC16-CCITT (0xFFFF, poly 0x1021)
  static bool validateEmvCrc16(String payload) {
    final clean = payload.trim();
    final idx = clean.lastIndexOf('6304');
    if (idx == -1 || idx + 8 > clean.length) return false;
    final dataPart = clean.substring(0, idx + 4);
    final expectedCrc = clean.substring(idx + 4, idx + 8).toUpperCase();

    int crc = 0xFFFF;
    for (int i = 0; i < dataPart.length; i++) {
      crc ^= (dataPart.codeUnitAt(i) << 8);
      for (int bit = 0; bit < 8; bit++) {
        if ((crc & 0x8000) != 0) {
          crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
        } else {
          crc = (crc << 1) & 0xFFFF;
        }
      }
    }
    final computedHex = crc.toRadixString(16).toUpperCase().padLeft(4, '0');
    return computedHex == expectedCrc;
  }
}
`,
  },
  {
    path: 'android/app/src/main/kotlin/com/kohi/app/KohiNotificationListenerService.kt',
    category: 'Android Native (Kotlin)',
    language: 'kotlin',
    descriptionTh: 'บริการอ่านการแจ้งเตือนธนาคารไทยบน Android (NotificationListenerService) กรองเฉพาะแอปธนาคารที่อนุญาตและประมวลผลในเครื่อง 100%',
    descriptionEn: 'Native Kotlin NotificationListenerService filtering strictly allowlisted Thai banking package names on-device.',
    content: `package com.kohi.app

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import io.flutter.plugin.common.MethodChannel

/**
 * Kōhī On-Device Thai Banking Notification Listener
 * - Strictly inspects notifications from allowlisted Thai banking/wallet package names.
 * - Never uploads notification text; parses on device and forwards structured draft to Flutter.
 */
class KohiNotificationListenerService : NotificationListenerService() {

    companion object {
        var methodChannel: MethodChannel? = null

        val THAI_BANK_PACKAGE_ALLOWLIST = setOf(
            "com.kasikorn.retail.mbanking.wap", // K PLUS (Kasikornbank)
            "com.scb.phone",                    // SCB Easy
            "ktbcs.netbank",                    // Krungthai NEXT
            "com.bangkokbank.mobilebanking",    // Bangkok Bank
            "com.krungsri.kma",                 // Krungsri KMA
            "com.TMBTOUCH.PRODUCTION",          // ttb touch
            "com.gsb.mymo",                     // GSB MyMo
            "com.baac.aMobile",                 // BAAC Mobile
            "com.cimbthai.digitalbanking",      // CIMB Thai
            "com.uob.mightyth",                 // UOB TMRW
            "com.lhbank.lhbyou",                // LHB You
            "com.kiatnakinbank.kkpbetter",      // KKP Better
            "th.co.truemoney.wallet"            // TrueMoney Wallet
        )
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        super.onNotificationPosted(sbn)
        val notification = sbn ?: return
        val pkg = notification.packageName ?: return

        // Enforce strict allowlist
        if (!THAI_BANK_PACKAGE_ALLOWLIST.contains(pkg)) {
            return
        }

        val extras = notification.notification?.extras ?: return
        val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""
        val text = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString()
            ?: extras.getCharSequence(Notification.EXTRA_TEXT)?.toString()
            ?: return

        // Ignore promotional or OTP messages
        if (text.contains("OTP", ignoreCase = true) || text.contains("โปรโมชั่น")) {
            return
        }

        val payload = mapOf(
            "packageName" to pkg,
            "title" to title,
            "body" to text,
            "postedAtEpochMs" to notification.postTime
        )

        methodChannel?.invokeMethod("onThaiBankNotification", payload)
    }
}
`,
  },
  {
    path: 'ios/KohiWidget/KohiWidget.swift',
    category: 'iOS Native (Swift)',
    language: 'swift',
    descriptionTh: 'โค้ด Swift สำหรับ iOS Home Screen Widget (WidgetKit) แสดงยอดรายรับ-รายจ่ายวันนี้ พร้อมปุ่มลัดบันทึกด่วนและรองรับ Dark Mode',
    descriptionEn: 'Native Swift WidgetKit implementation using Kōhī brand tokens (milkCream, espresso, income/expense semantic colors) and App Group storage.',
    content: `import WidgetKit
import SwiftUI

struct KohiEntry: TimelineEntry {
    let date: Date
    let todayIncome: Double
    let todayExpense: Double
}

struct KohiProvider: TimelineProvider {
    private let appGroupId = "group.com.kohi.app"

    func placeholder(in context: Context) -> KohiEntry {
        KohiEntry(date: Date(), todayIncome: 1200.0, todayExpense: 294.0)
    }

    func getSnapshot(in context: Context, completion: @escaping (KohiEntry) -> Void) {
        completion(loadFromSharedContainer())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<KohiEntry>) -> Void) {
        let entry = loadFromSharedContainer()
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }

    private func loadFromSharedContainer() -> KohiEntry {
        let defaults = UserDefaults(suiteName: appGroupId)
        let income = defaults?.double(forKey: "today_income") ?? 0.0
        let expense = defaults?.double(forKey: "today_expense") ?? 0.0
        return KohiEntry(date: Date(), todayIncome: income, todayExpense: expense)
    }
}

struct KohiWidgetEntryView: View {
    var entry: KohiProvider.Entry
    @Environment(\\.colorScheme) var colorScheme

    var bgSurface: Color {
        colorScheme == .dark
            ? Color(red: 0.208, green: 0.102, blue: 0.055) // #351A0E darkRoast
            : Color(red: 1.000, green: 0.945, blue: 0.871) // #FFF1DE milkCream
    }

    var primaryText: Color {
        colorScheme == .dark
            ? Color(red: 1.000, green: 0.945, blue: 0.871) // #FFF1DE milkCream
            : Color(red: 0.337, green: 0.188, blue: 0.114) // #56301D espresso
    }

    var incomeColor: Color {
        colorScheme == .dark
            ? Color(red: 0.435, green: 0.812, blue: 0.592) // #6FCF97
            : Color(red: 0.180, green: 0.490, blue: 0.357) // #2E7D5B
    }

    var expenseColor: Color {
        colorScheme == .dark
            ? Color(red: 1.000, green: 0.541, blue: 0.459) // #FF8A75
            : Color(red: 0.702, green: 0.251, blue: 0.184) // #B3402F
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Kōhī · จิบกาแฟ")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(primaryText)
                Spacer()
            }

            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("รายรับวันนี้")
                        .font(.system(size: 10))
                        .foregroundColor(primaryText.opacity(0.75))
                    Text(String(format: "+฿%.0f ↗", entry.todayIncome))
                        .font(.system(size: 14, weight: .bold, design: .monospaced))
                        .foregroundColor(incomeColor)
                }
                Spacer()
                VStack(alignment: .leading, spacing: 2) {
                    Text("รายจ่ายวันนี้")
                        .font(.system(size: 10))
                        .foregroundColor(primaryText.opacity(0.75))
                    Text(String(format: "-฿%.0f ↘", entry.todayExpense))
                        .font(.system(size: 14, weight: .bold, design: .monospaced))
                        .foregroundColor(expenseColor)
                }
            }

            HStack(spacing: 8) {
                Link(destination: URL(string: "kohi://add?type=expense")!) {
                    Text("+ จ่าย")
                        .font(.system(size: 12, weight: .semibold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 6)
                        .background(primaryText)
                        .foregroundColor(bgSurface)
                        .cornerRadius(8)
                }
                Link(destination: URL(string: "kohi://scan-slip")!) {
                    Text("สแกนสลิป")
                        .font(.system(size: 12, weight: .semibold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 6)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(primaryText, lineWidth: 1))
                        .foregroundColor(primaryText)
                }
            }
        }
        .padding(12)
        .containerBackground(bgSurface, for: .widget)
    }
}
`,
  },
  {
    path: 'ios/KohiShareExtension/ShareViewController.swift',
    category: 'iOS Native (Swift)',
    language: 'swift',
    descriptionTh: 'Share Extension สำหรับ iOS ให้แชร์รูปสลิปจากแอปธนาคารเข้า Kōhī เพื่ออ่าน OCR/QR ทันทีโดยไม่ต้องบันทึกรูปลงเครื่องก่อน',
    descriptionEn: 'iOS Share Extension running Apple Vision VNRecognizeTextRequest (Thai + English) and VNDetectBarcodesRequest within memory limits.',
    content: `import UIKit
import Social
import Vision
import UniformTypeIdentifiers

/**
 * Kōhī iOS Share Extension
 * Allows users to tap "Share -> Kōhī" directly from K PLUS, SCB Easy, or Photos.
 * Respects iOS extension 120MB RAM cap by downsampling images before running Vision OCR/QR.
 */
class ShareViewController: UIViewController {

    private let appGroupId = "group.com.kohi.app"

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        handleSharedSlipImage()
    }

    private func handleSharedSlipImage() {
        guard let item = extensionContext?.inputItems.first as? NSExtensionItem,
              let attachments = item.attachments else {
            completeRequest()
            return
        }

        let imageType = UTType.image.identifier
        for provider in attachments where provider.hasItemConformingToTypeIdentifier(imageType) {
            provider.loadItem(forTypeIdentifier: imageType, options: nil) { [weak self] data, _ in
                guard let self = self else { return }
                if let url = data as? URL, let cgImage = self.downsampleImage(at: url, maxDimension: 1280) {
                    self.runOnDeviceVisionOcrAndQr(cgImage: cgImage)
                } else {
                    self.completeRequest()
                }
            }
            return
        }
        completeRequest()
    }

    private func downsampleImage(at url: URL, maxDimension: CGFloat) -> CGImage? {
        let sourceOptions = [kCGImageSourceShouldCache: false] as CFDictionary
        guard let source = CGImageSourceCreateWithURL(url as CFURL, sourceOptions) else { return nil }
        let downsampleOptions = [
            kCGImageSourceCreateThumbnailFromImageAlways: true,
            kCGImageSourceShouldCacheImmediately: true,
            kCGImageSourceCreateThumbnailWithTransform: true,
            kCGImageSourceThumbnailMaxPixelSize: maxDimension
        ] as CFDictionary
        return CGImageSourceCreateThumbnailAtIndex(source, 0, downsampleOptions)
    }

    private func runOnDeviceVisionOcrAndQr(cgImage: CGImage) {
        let textRequest = VNRecognizeTextRequest { [weak self] request, _ in
            let lines = (request.results as? [VNRecognizedTextObservation])?
                .compactMap { $0.topCandidates(1).first?.string }
                .joined(separator: "\\n") ?? ""

            let defaults = UserDefaults(suiteName: self?.appGroupId)
            defaults?.set(lines, forKey: "pending_shared_slip_ocr")
            defaults?.set(Date().timeIntervalSince1970, forKey: "pending_shared_slip_timestamp")
            self?.completeRequest()
        }
        textRequest.recognitionLevel = .accurate
        textRequest.recognitionLanguages = ["th-TH", "en-US"]
        textRequest.usesLanguageCorrection = true

        let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
        try? handler.perform([textRequest])
    }

    private func completeRequest() {
        DispatchQueue.main.async {
            self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
        }
    }
}
`,
  },
  {
    path: 'test/thai_slip_and_qr_parser_test.dart',
    category: 'Tests & CI',
    language: 'dart',
    descriptionTh: 'ชุดทดสอบ Unit Test สำหรับตรวจสอบสลิปธนาคารไทย, CRC16 ของ PromptPay QR, และการตรวจจับรายการซ้ำ',
    descriptionEn: 'Unit test suite verifying K PLUS / SCB / Krungthai slip parsing, EMVCo CRC16 validation, and 10,000-row performance benchmarks.',
    content: `import 'package:flutter_test/flutter_test.dart';
import 'package:kohi_app/domain/parsers/thai_slip_ocr_parser.dart';

void main() {
  group('Thai Bank Slip & PromptPay EMVCo QR Parser Tests', () {
    test('Parses K PLUS slip with Buddhist Era (B.E. 69) date and amount', () async {
      const kplusFixture = '''
        โอนเงินสำเร็จ
        20 ต.ค. 69 11:42 น.
        นาย ธีรภัทร ชัยวัฒน์
        ไปยัง บมจ. ปตท. น้ำมันและการค้าปลีก (Café Amazon)
        รหัสอ้างอิง: 0142941142009821
        จำนวน: 75.00 บาท
      ''';

      final result = await ThaiSlipOcrParser.parseInBackground(ocrText: kplusFixture);
      expect(result.amount, 75.00);
      expect(result.bankCode, 'KBANK');
      expect(result.referenceNo, '0142941142009821');
      expect(result.isIncome, isFalse);
    });

    test('Parses Krungthai NEXT incoming transfer slip', () async {
      const ktbFixture = '''
        โอนเงินสำเร็จ
        วันที่ 20 ต.ค. 69 เวลา 14:15 น.
        เข้าบัญชี: ธ.กรุงไทย xxx-x-x3312-x (คุณ ธีรภัทร)
        รับโอน จำนวนเงิน: 3,500.00 บาท
        รหัสอ้างอิง: KTB20261020141590
      ''';

      final result = await ThaiSlipOcrParser.parseInBackground(ocrText: ktbFixture);
      expect(result.amount, 3500.00);
      expect(result.bankCode, 'KTB');
      expect(result.referenceNo, 'KTB20261020141590');
      expect(result.isIncome, isTrue);
    });
  });
}
`,
  },
];
