# Wasool.io (वूसल) — Autonomous WhatsApp A/R Recovery Engine & Embedded B2B API

> **"Automated, diplomatic WhatsApp payment reminders with 1-tap UPI links—get paid 2.5x faster without awkward phone calls."**

---

## 1. Executive Summary & Problem Space

B2B payment delays in India average 45–90+ days. The core bottlenecks:
1. **Email reminders get lost:** Zoho/Tally emails are ignored; Indian business runs on WhatsApp.
2. **Social awkwardness:** Business owners and account managers hesitate to chase clients manually to preserve relationships.
3. **NEFT/RTGS friction:** Bank transfers require adding beneficiaries with 30–120 minute cooling periods. Dynamic UPI links settle instantly via GPay, PhonePe, and Paytm.

### Dual Distribution Strategy:
1. **Direct B2B SaaS:** For Indian digital agencies, IT consultancies, law/CA firms, and MSMEs (₹1,499–₹3,999/mo).
2. **Embedded Partner API (White-Label):** Plug-and-play REST webhooks for bookkeeping apps (**Khatabook, myBillBook, Vyapar, Swipe**) to offer "Autopilot WhatsApp Collections" as a premium add-on to their merchants.

---

## 2. System Architecture

```
+----------------------------------------------------------------------------------+
| INGESTION LAYER                                                                  |
|                                                                                  |
| [Direct Web App / CSV Drop]  [Zoho / Razorpay Webhooks]  [Partner API: Khatabook]|
+----------------------------------------┬-----------------------------------------+
                                         │ HTTPS (POST /api/v1/partner/invoices/sync)
                                         ▼
+----------------------------------------------------------------------------------+
| WASOOL CORE ENGINE (Next.js 15 App Router / Node.js Serverless)                  |
|                                                                                  |
| 1. Ingestion Worker: Validates Bearer/Partner token, normalizes GSTIN & phone.   |
| 2. Deep-Link Generator: Builds NPCI-compliant UPI Intent URLs & QR payloads.     |
| 3. Escalation State Machine: Schedules T-2, Due Date, T+3, T+7, T+15 stages.     |
+----------------------------------------┬-----------------------------------------+
                                         │
                                         ▼
+----------------------------------------------------------------------------------+
| PERSISTENCE & DETERMINISTIC SCHEDULER                                            |
|                                                                                  |
| • Supabase (PostgreSQL): Multi-tenant RLS, Invoices, Debtors, Partner Keys       |
| • Dual-Mode Fallback: Local pre-seeded JSON store (.data/) for zero-config dev   |
| • Upstash QStash Cron: Triggers daily at 10:30 AM IST (Peak Indian Business Hrs) |
+----------------------------------------┬-----------------------------------------+
                                         │
                                         ▼
+----------------------------------------------------------------------------------+
| DELIVERY & SETTLEMENT RECONCILIATION                                             |
|                                                                                  |
| • Meta WhatsApp Cloud API (v21.0): Pre-approved diplomatic utility templates     |
| • Payment Webhooks (Razorpay / Cashfree): Instant settlement listener            |
|   ↳ On 'PAID': Cancels queued reminders & updates invoice status                 |
+----------------------------------------------------------------------------------+
```

---

## 3. Technology Stack

* **Framework & API:** Next.js 15 (App Router, TypeScript)
* **Styling & UI:** Tailwind CSS, `shadcn`-inspired dark fintech UI, Lucide Icons, `qrcode`
* **Database & Auth:** Supabase (PostgreSQL with Row Level Security) + Built-in Local Seed Fallback
* **Task Scheduling:** Upstash QStash (Daily 10:30 AM IST cron job)
* **Messaging:** Meta WhatsApp Cloud API (Graph v21.0)
* **Payments:** Native NPCI UPI Intent (`upi://pay`) + Razorpay Subscriptions & Webhooks

---

## 4. Key Escalation State Machine & Templates

All WhatsApp reminders use pre-approved Meta Utility templates with an audit-framed, diplomatic tone:

1. **`T_MINUS_2_COURTESY` (`ar_courtesy_ping`):**
   > *"Hi {{1}}, greetings from {{2}}. This is a gentle reminder that Invoice #{{3}} for ₹{{4}} is scheduled for due date {{5}}. You can complete the transfer seamlessly via 1-tap UPI below."*
2. **`T_ZERO_DUE_DATE` (`ar_due_today`):**
   > *"Hi {{1}}, this is the accounts desk at {{2}}. Invoice #{{3}} for ₹{{4}} is due today ({{5}}). Tap below to settle instantly via UPI — it takes under 10 seconds."*
3. **`T_PLUS_3_RECONCILIATION` (`ar_audit_reconciliation`):**
   > *"Hi {{1}}, our accounts team at {{2}} is reconciling monthly ledgers. We haven't recorded the settlement of ₹{{3}} for Invoice #{{4}} (Due: {{5}}). If already paid, please reply with the UTR number, or settle instantly via UPI below."*
4. **`T_PLUS_7_FORMAL_NOTICE` (`ar_overdue_escalation`):**
   > *"Dear {{1}}, Invoice #{{2}} for ₹{{3}} from {{4}} is now 7 days overdue. To avoid an automated hold on ongoing deliverables/account credit, please clear the balance today using the instant UPI link below."*
5. **`T_PLUS_15_SUSPENSION_ALERT` (`ar_suspension_notice`):**
   > *"Dear {{1}}, Invoice #{{2}} for ₹{{3}} from {{4}} is now 15 days overdue (Due: {{5}}). As per our credit terms, ongoing services and account credit may be placed on hold until the balance is cleared. Please settle today via the UPI link below, or reply with the UTR if already paid."*

---

## 5. Local Setup & Quick Start

Wasool includes a **Dual-Mode Data & Dispatch layer**. You can run the entire application locally with zero third-party credentials: it automatically uses an in-memory/JSON store pre-loaded with realistic Indian MSMEs and overdue invoices.

### Prerequisites
* Node.js 18.18+ or 20+
* npm or pnpm

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd happy-mendel

# Install dependencies
npm install

# Copy environment variables template (optional for local mode)
cp .env.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser:
* **Landing Page:** `http://localhost:3000/` (Live WhatsApp & UPI QR simulator)
* **B2B Dashboard:** `http://localhost:3000/dashboard` (Aging buckets, CSV importer, 1-click Mark Paid, Cron simulator)
* **Partner API Docs & Playground:** `http://localhost:3000/partner-docs` (Interactive API tester with pre-filled test keys)

### Helpful Scripts

```bash
# Typecheck TypeScript
npm run typecheck

# Production Build
npm run build

# Generate a new white-label partner API key (with SQL snippet for Supabase)
npm run partner-key -- "Khatabook Production" khatabook
```

---

## 6. Embedded Partner API Specification

Bookkeeping platforms integrate Wasool using two simple REST endpoints:

### Sync Invoice & Activate Autopilot
```http
POST /api/v1/partner/invoices/sync
Authorization: Bearer wsl_live_...
Content-Type: application/json

{
  "partner_id": "khatabook",
  "merchant": {
    "id": "kb_99281",
    "business_name": "Sharma Traders",
    "upi_vpa": "sharmatraders@hdfcbank"
  },
  "debtor": {
    "name": "Metro Retail Pvt Ltd",
    "phone": "+919820112233",
    "contact_person": "Suresh"
  },
  "invoice": {
    "number": "INV-2026-884",
    "amount_pending": 64200.00,
    "due_date": "2026-11-15"
  }
}
```

### Halt Reminders on Settlement
```http
POST /api/v1/partner/invoices/settle
Authorization: Bearer wsl_live_...
Content-Type: application/json

{
  "partner_id": "khatabook",
  "merchant_id": "kb_99281",
  "invoice_number": "INV-2026-884",
  "utr_reference": "431902218874"
}
```

---

## 7. Deployment Guide (Vercel)

Wasool is optimized for seamless deployment on Vercel as a Serverless Next.js 15 application.

### Step 1: Push Code to GitHub / GitLab
```bash
git add .
git commit -m "feat: complete wasool.io recovery engine"
git push origin main
```

### Step 2: Import Project to Vercel
1. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
2. Select your repository.
3. Framework Preset: **Next.js** (auto-detected).
4. Root Directory: `./`.

### Step 3: Configure Environment Variables in Vercel
In the Vercel Project Settings under **Environment Variables**, configure:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `APP_URL` | Your public domain (used for WhatsApp `/pay/[id]` links) | `https://wasool.io` or `https://your-app.vercel.app` |
| `SUPABASE_URL` | Supabase Project URL | `https://xyz.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Secret (bypasses RLS for API routes) | `eyJhbGciOi...` |
| `META_PHONE_NUMBER_ID` | WhatsApp Business Account Phone Number ID | `104829102910...` |
| `META_SYSTEM_USER_TOKEN` | Permanent Meta System User Token with `whatsapp_business_messaging` | `EAAG...` |
| `META_WEBHOOK_VERIFY_TOKEN` | Custom string to verify Meta delivery webhook | `wsl_meta_secret_2026` |
| `CRON_SECRET` | Secret token to authenticate the daily cron endpoint | `crn_sec_8492019482` |
| `QSTASH_CURRENT_SIGNING_KEY` | (Optional) Upstash QStash current signing key | `sig_...` |
| `RAZORPAY_WEBHOOK_SECRET` | (Optional) Secret for Razorpay payment reconciliation | `whsec_...` |
| `DASHBOARD_PASSWORD` | (Optional) Password for HTTP Basic Auth on `/dashboard` | `SecurePassword123` |

*(Note: If `SUPABASE_URL` is omitted, the app will run using the in-memory fallback store on Vercel.)*

### Step 4: Run the Database Migrations (Supabase)
1. In your Supabase dashboard, navigate to the **SQL Editor**.
2. Copy and paste the contents of [`supabase/schema.sql`](supabase/schema.sql).
3. Click **Run** to set up tables, types, foreign keys, and indexes.

### Step 5: Configure the Daily 10:30 AM IST Cron (Upstash QStash)
1. Go to [console.upstash.com/qstash](https://console.upstash.com/qstash).
2. Create a new Scheduled Request:
   - **Destination URL:** `https://your-domain.vercel.app/api/cron/daily-dispatch`
   - **Cron Expression:** `CRON_TZ=Asia/Kolkata 30 10 * * *` (or `30 5 * * *` UTC)
   - **Headers:** `Authorization: Bearer <YOUR_CRON_SECRET>`
3. Save the schedule.

### Step 6: Configure Meta WhatsApp Webhook (Optional)
In Meta Business Manager:
1. Under WhatsApp → Configuration → Webhook, set the Callback URL:
   `https://your-domain.vercel.app/api/webhooks/whatsapp`
2. Verify Token: Match your `META_WEBHOOK_VERIFY_TOKEN`.
3. Subscribe to the `messages` event to automatically receive read receipts (`SENT`, `DELIVERED`, `READ`, `FAILED`).

---

## 8. License & Commercial Use

© Wasool.io. Built for Indian Digital Agencies, B2B Consultancies, and SMB Bookkeeping Platforms.
