# Kōhī (จิบกาแฟ) — Thai Banking Income & Expense Tracker + Full Flutter/Native Codebase

Kōhī (จิบกาแฟ) is a privacy-first, offline-first personal finance application built specifically for the Thai banking ecosystem. Because AI Studio runs in the web browser and you plan to install and test the native app on your own mobile device, this project delivers both a **fully interactive Kōhī Web Application** (with photo-album slip scanning upon permission, pre-loaded Thai bank notification simulators, PromptPay QR parsing, and SQL-like calendar/chart reports) and a **complete, ready-to-compile Flutter + Kotlin + Swift Source Code Studio & Project Exporter** so you can inspect or download the entire mobile repository (Dart, SQLCipher Drift database, Android `NotificationListenerService`, and iOS WidgetKit / Share Extension / App Intents) to build and install directly on your phone.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Confirmed Choices from Phase 1:**
> - **Delivery Format**: Interactive Kōhī Application in the browser **plus** an integrated Flutter / Android Kotlin / iOS Swift Source Code Explorer & Project Bundle Downloader so you can build and test on your physical phone.
> - **Slip, QR & Notification Testing**: Album/photo-picker permission flow on app open to scan slip screenshots from your device gallery (plus sample Thai bank slips and PromptPay QRs for instant testing) alongside pre-loaded Thai bank notification simulators (K PLUS, SCB Easy, Krungthai NEXT, etc.) with duplicate detection.
> - **Localization & Calendar**: Bilingual UI (`th_TH` Thai default + English toggle) with dynamic **Buddhist Era (พ.ศ. 2569) / Christian Era (ค.ศ. 2026)** switcher, `Asia/Bangkok` timezone, and `฿` (THB) currency formatting.

---

## 1. Overview & Core Concept

- **What It Does**: Tracks personal income and expenses across all 14 major Thai banks and e-wallets (Kasikornbank K PLUS, SCB Easy, Krungthai NEXT, Bangkok Bank, Krungsri KMA, ttb touch, GSB MyMo, BAAC, CIMB Thai, UOB, LH Bank, Kiatnakin Phatra, TrueMoney Wallet, and PromptPay). It automatically extracts transaction details on-device from Thai bank transfer slips (OCR + EMVCo/PromptPay TLV QR payloads) and Android banking notifications without ever uploading financial images or text to external servers.
- **Target Audience / Persona**: Thai consumers and expats who use PromptPay and mobile banking daily and want zero-friction automated bookkeeping with strict on-device privacy (PDPA-compliant) and a warm, calming coffee-shop aesthetic.
- **Key Value**: Eliminates manual entry fatigue through on-device slip OCR, TLV QR decoding, and Android notification parsing—combined with smart duplicate detection across all three channels (matching on amount, ±5-minute timestamp window, and reference number) and complete offline-first SQLCipher security.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Onboarding & Permission Rationale Flow (3–4 Screens)**:
   - Introduces the Kōhī coffee-bean mascot, offline-first privacy guarantee, and default calendar/language setup (Thai พ.ศ. 2569 / English C.E. 2026).
   - **Smart Automation Choice**: Presents the Android Notification Access educational disclosure screen (*"Allow"* → enables Notification Listener mode and disables auto-scan on app open; *"Not now"* → enables Photo Library Slip/QR Auto-Scan prompt when the app opens).
2. **App-Open Photo Album Slip & QR Scanner**:
   - When opened (if notification reading is off or via the quick action button), offers a non-intrusive bottom sheet to scan recent slip screenshots from the user's photo album (using scoped photo picker / file input) or choose from realistic pre-loaded Thai bank slips (K PLUS, SCB Easy, Krungthai NEXT, PromptPay QR).
   - Runs client-side image compression (resizing longest edge $\le 1280\text{px}$, WebP/JPEG quality ~70%, stripping EXIF/GPS metadata, generating a thumbnail, and tracking storage usage) plus on-device OCR & EMVCo TLV CRC16 QR parsing.
   - Displays an editable **Slip Confirmation Sheet** showing extracted amount, date/time (B.E./C.E.), sender, receiver, bank account, reference ID, memo, and duplicate-detection status before saving.
3. **Core Tracking, Accounts & Auto-Categorization**:
   - Full CRUD for income/expense transactions with undo-on-delete toast, recurring rules, and monthly category budgets with progress bars (turning semantic warning `#D9A441` near limit).
   - Multi-account management across all 14 Thai banks/wallets with live per-account balances.
   - Auto-categorization engine that maps merchant names or keywords (e.g., `7-Eleven`, `Café Amazon`, `Grab`, `MEA/การไฟฟ้า`) to Thai-friendly categories and learns immediately when the user edits a category.
4. **Summary, Charts & Monthly Calendar View**:
   - **Monthly Calendar Grid**: Displays daily total income (`+` green), daily total expense (`-` red), and optional net balance inside `milkCream` cells with `latte` borders and `caramel` today highlight. Tapping any day opens that day's transaction drawer.
   - **Analytics & Reports**: Interactive Category Donut Chart (using the exact 8-color chart palette and grouping 9+ into "Other"), Day/Week/Month Bar Chart, and Income vs. Expense Trend Line Chart.
5. **Plans, Family Sharing (Pro) & Security Settings**:
   - **Free (฿0)** vs. **Pro (฿79/mo or ฿790/yr)** vs. **Premium (฿149/mo "Coming Soon" teaser with Notify Me toggle)** comparison paywall.
   - Interactive **Pro Family Sharing** flow (invite members, set nicknames, owner/member roles, selective sharing toggles, and encrypted cloud backup simulation).
   - **App Lock & Privacy Controls**: PIN / Biometric lock screen with attempt limiting, hide balances toggle (`฿ ••••`), image storage manager with *"Free up space"* action, CSV export, and PDPA full data wipe.
6. **Flutter & Native Source Code Studio (For Mobile Installation)**:
   - Dedicated workspace view where you can browse, copy, and download the complete, production-ready **Flutter + Native Kotlin + Swift project files** (including `pubspec.yaml`, Clean Architecture Riverpod + Drift SQLCipher code, pluggable Thai bank regex parsers & unit tests, Android `KohiNotificationListenerService.kt`, iOS `KohiWidget.swift`, `ShareViewController.swift`, `KohiShortcuts.swift`, and step-by-step Xcode/Gradle build instructions).

### Visual Identity & Theme
- **Aesthetic Direction**: Warm Artisanal Coffee-House Utility — tactile, calm, high-contrast legibility inspired by specialty coffee bars in Bangkok.
- **Brand Color Palette (Single Source of Truth)**:
  - `espresso` (`#56301D`): Primary buttons, app bar titles, brand wordmark, mascot primary tone.
  - `darkRoast` (`#351A0E`): Primary body text, crisp outlines, dark-mode card/surface container.
  - `caramel` (`#A66A43`): Selected states, icons, FAB, borders, today highlight (used strictly for large text, icons, and accents to respect WCAG AA 4.5:1 rules).
  - `latte` (`#D7B896`): Secondary containers, dividers, subtle borders, dark-mode primary action.
  - `milkCream` (`#FFF1DE`): Card/container backgrounds, calendar cells, mascot robe, dark-mode primary text.
  - `warmWhite` (`#FFFCF7`): Main light-mode canvas background.
  - **Dark Mode**: Canvas `#1E110A`, surface/cards `#351A0E` (`darkRoast`), text `#FFF1DE` (`milkCream`), primary action `#D7B896` (`latte`), accent `#C98B5E`.
  - **Semantic Tokens**:
    - Income: `#2E7D5B` (Light) / `#6FCF97` (Dark) — always paired with `+` and `↗` arrow icon.
    - Expense: `#B3402F` (Light) / `#FF8A75` (Dark) — always paired with `-` and `↘` arrow icon.
    - Warning: `#D9A441` (Light) / `#E8BF6A` (Dark)
    - Error: `#B3261E` (Light) / `#F2B8B5` (Dark)
  - **Chart Category Palette (Strict Order)**: `#A66A43`, `#56301D`, `#D7B896`, `#7A9A6B`, `#C4623F`, `#D9A441`, `#5F7A8C`, `#8A5A7A` (auto-grouping smaller categories beyond 8 into `"Other / อื่นๆ"`).
- **Typography & Hierarchy**:
  - Display / Headings: `Plus Jakarta Sans` paired with Thai-harmonized `Noto Sans Thai` / `IBM Plex Sans Thai` for crisp bilingual legibility.
  - Financial Figures, Dates & Reference Codes: `JetBrains Mono` with `font-variant-numeric: tabular-nums` so all `฿` amounts and calendar cells align vertically without jitter.
- **Component Styling & Ergonomics**:
  - Responsive layout supporting both mobile touch ergonomics ($\ge 44\times 44\text{px}$ hitboxes, thumb-friendly bottom navigation) and an expansive 1440px desktop multi-column workspace.
  - Single-elevation cards (`milkCream` `#FFF1DE` on `warmWhite` `#FFFCF7` with `1px solid #D7B896` `latte` hairline dividers), zero nested card clutter, and unboxed metadata with clean `·` typographic separators.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dual Web-Simulator + Exportable Native Flutter Codebase**
  - *Chosen Approach*: Build a full-featured, interactive Kōhī web application using the exact Clean Architecture domain logic (EMVCo TLV QR parser, Thai bank slip OCR regex templates, duplicate detector, image compressor, and indexed aggregation engine) while embedding a complete **Flutter / Kotlin / Swift Code Studio & One-Click Project Exporter**.
  - *Why*: Lets you immediately test every feature, album upload, notification rule, and Thai B.E. calendar flow right here in AI Studio, and then export the complete Dart/Kotlin/Swift source files to compile and install on your physical Android or iOS device.
- **Decision 2: Pluggable Thai Bank Parser Engine with Real EMVCo TLV + CRC16 Validation**
  - *Chosen Approach*: Implement a real byte-level EMVCo / Thai PromptPay QR TLV parser (validating tag `00`, merchant/PromptPay tag `29`/`30`, Mini-QR bank slip tag `00` + sending bank ID + transaction ref, tag `54` amount, and `63` CRC16-CCITT checksum) alongside modular regex slip/notification parsers for K PLUS, SCB Easy, Krungthai NEXT, Bangkok Bank, Krungsri KMA, ttb touch, GSB MyMo, and TrueMoney.
  - *Why*: Ensures both the interactive web app and the exported Dart code genuinely parse real Thai PromptPay QRs and Thai slip text (including Buddhist Era dates like `20 ต.ค. 69` or `2569`).
- **Decision 3: Multi-Channel Duplicate Detection**
  - *Chosen Approach*: Compute a deterministic composite fingerprint across `(amount, timestamp ±5 min window, normalized reference number)` whenever a transaction arrives from a Notification, Slip OCR, or QR scan.
  - *Why*: Prevents double-counting when a user receives a K PLUS push notification and also saves or scans the transfer slip screenshot.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                     Kōhī (จิบกาแฟ) — Clean Architecture System                     │
├───────────────────────────────────────────────────────────────────────────────────┤
│  PRESENTATION LAYER (Bilingual th_TH / en_US · B.E. 2569 / C.E. 2026 · M3 Theme)  │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐  │
│  │  Dashboard &    │ │  Monthly B.E.   │ │ Slip/QR Album   │ │  Flutter/Native │  │
│  │  Transactions   │ │  Calendar &     │ │ Scanner & Notif │ │  Code Studio &  │  │
│  │  + Undo / CSV   │ │  SQL Analytics  │ │ Simulator Sheet │ │  ZIP Exporter   │  │
│  └────────┬────────┘ └────────┬────────┘ └────────┬────────┘ └────────┬────────┘  │
├───────────┼───────────────────┼───────────────────┼───────────────────┼───────────┤
│  DOMAIN LAYER (Pure Business Logic — Shared in Web & Exported Dart Codebase)      │
│  ┌────────▼────────┐ ┌────────▼────────┐ ┌────────▼────────┐ ┌────────▼────────┐  │
│  │ Transaction &   │ │ Pluggable Bank  │ │ Duplicate       │ │ Auto-Category   │  │
│  │ Budget UseCases │ │ Slip/QR/Notif   │ │ Detector (Amt + │ │ Rule Engine &   │  │
│  │ (14 Thai Banks) │ │ Parser + CRC16  │ │ ±5m + RefCode)  │ │ Learner         │  │
│  └────────┬────────┘ └────────┬────────┘ └────────┬────────┘ └────────┬────────┘  │
├───────────┼───────────────────┼───────────────────┼───────────────────┼───────────┤
│  DATA & NATIVE PLATFORM LAYER                                                     │
│  ┌────────▼───────────────────▼────────┐ ┌────────▼───────────────────▼────────┐  │
│  │ Encrypted Local Store (Drift/SQLite │ │ Native Platform Bridges (Pigeon)    │  │
│  │ + SQLCipher Key in Keystore/Keychain│ │ • Android: NotificationListener.kt  │  │
│  │ + AES-256-GCM Compressed Slips)     │ │ • iOS: WidgetKit, ShareExt, Intents │  │
│  └─────────────────────────────────────┘ └─────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State
- **Accounts (`accounts`)**: `id`, `bankCode` (`KBANK`, `SCB`, `KTB`, `BBL`, `BAY`, `TTB`, `GSB`, `BAAC`, `CIMB`, `UOB`, `LHB`, `KKP`, `TRUEMONEY`, `PROMPTPAY`), `nameTh`, `nameEn`, `balance`, `colorHex`, `isDefault`.
- **Categories (`categories`)**: `id`, `nameTh`, `nameEn`, `type` (`income` | `expense`), `iconName`, `colorHex`, `monthlyBudget` (optional).
- **Transactions (`transactions`)**: `id`, `amount`, `type` (`income` | `expense`), `categoryId`, `accountId`, `timestamp`, `note`, `tags[]`, `referenceNo`, `senderName`, `receiverName`, `source` (`manual` | `slip_ocr` | `qr_scan` | `notification`), `slipImageId`, `isRecurring`, `recurringInterval`.
  - *Indexed Columns*: `idx_tx_timestamp`, `idx_tx_category_type_date`, `idx_tx_dedup (amount, referenceNo, timestamp)`.
- **Auto-Categorization Rules (`category_rules`)**: `id`, `keyword` (normalized lowercase merchant/memo substring), `categoryId`, `learnedFromUser` (boolean), `hitCount`.
- **Compressed Slip Images (`slip_images`)**: `id`, `transactionId`, `compressedDataUrl`, `thumbnailDataUrl`, `originalBytes`, `compressedBytes` ($\le 150\text{KB}$ target, EXIF stripped), `width`, `height`, `createdAt`.
- **Family & Pro Sync State (`family_group`)**: `groupId`, `members[]` (`id`, `nickname`, `email`, `role`: `owner` | `member`, `shareIncome`, `shareExpense`), `lastBackupAt`, `encryptionEnabled`.

### Interactive Component & State Mapping
- **Album Slip Scanner & Pre-loaded Notification Tester**:
  - Selecting *"Scan from Photo Album"* opens the device file/photo picker (or lets you pick from 6 realistic Thai bank slip fixtures). The image is resized on an HTML5 `<canvas>` ($\le 1280\text{px}$, JPEG/WebP 0.7 quality, EXIF stripped), parsed via the pluggable Thai bank slip/QR engine, checked against existing transactions for duplicates, and presented in an editable confirmation modal.
  - Firing any pre-loaded Android bank notification (`K PLUS`, `SCB Easy`, `Krungthai NEXT`, `ttb touch`, `TrueMoney`) runs the exact regex rules from the versioned config, triggers duplicate detection, and either creates a draft or auto-saves based on user preference.
- **Calendar & Report Aggregations**:
  - Switching between Week / Month / Year / Custom periods or tapping a day cell in the Monthly B.E. Calendar immediately re-computes grouped totals, category donut slices (capping at 8 + "Other"), and daily cashflow bars.
- **Flutter & Native Code Explorer**:
  - Interactive file tree displaying the complete production source files (`lib/core/theme/app_colors.dart`, `lib/data/local/app_database.dart`, `lib/domain/parsers/thai_slip_parser.dart`, `android/.../KohiNotificationListenerService.kt`, `ios/KohiWidget/KohiWidget.swift`, `ios/KohiShareExtension/ShareViewController.swift`, `README.md`, unit tests, and CI workflow) with syntax view, single-file copy, and a **"Download Full Flutter Project Bundle"** action.
