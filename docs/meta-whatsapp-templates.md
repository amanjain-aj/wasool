# Wasool.io — Meta WhatsApp Cloud API Template Specification
**Target:** 100% Approval Rate on Meta Business Manager (WhatsApp Manager)  
**Category:** UTILITY (Lowest Meta delivery cost, zero spam flag risk)  
**Supported Languages:** English (`en`), Hinglish (`en_IN`), Hindi (`hi`)

---

## 1. Template 1: `wasool_bill_courtesy_t2` (T-2 Days Courtesy Reminder)
*Sent 2 business days before invoice due date. Eliminates the "Bill nahi mila" excuse by attaching the original PDF/photo in the header.*

- **Template Name:** `wasool_bill_courtesy_t2`
- **Category:** `UTILITY`
- **Language:** English (`en`) / Hinglish
- **Header:** `DOCUMENT` or `IMAGE` (Media attachment: Original invoice PDF or Challan Photo)
- **Body:**
  ```text
  Namaste {{1}},
  
  Greetings from {{2}}. This is a gentle reminder that Invoice #{{3}} for ₹{{4}} is due in 2 days on {{5}}.
  
  The original invoice copy is attached above for your accounts records. You can clear this in 1-tap using any UPI app below.
  ```
- **Sample Values:**
  - `{{1}}`: `Rajesh Gupta`
  - `{{2}}`: `Sharma Hardware & Sanitary LLP`
  - `{{3}}`: `INV-2026-901`
  - `{{4}}`: `48,500`
  - `{{5}}`: `12 Nov 2026`
- **Buttons:**
  1. **URL Button:**
     - **Button Text:** `Pay Now via UPI`
     - **URL Type:** `Dynamic`
     - **Website URL:** `https://wasool.io/pay/{{1}}`
     - **Sample:** `https://wasool.io/pay/550e8400-e29b-41d4-a716-446655440000`

---

## 2. Template 2: `wasool_bill_due_today` (T-0 Due Date Tagada)
*Dispatched at 10:30 AM IST on the exact due date.*

- **Template Name:** `wasool_bill_due_today`
- **Category:** `UTILITY`
- **Header:** `DOCUMENT` or `NONE`
- **Body:**
  ```text
  Namaste {{1}},
  
  Invoice #{{2}} from {{3}} for ₹{{4}} is due today ({{5}}).
  
  Please approve the payment to avoid delivery holds or ledger interest. Tap below to clear instantly via GPay / PhonePe / Paytm / BHIM UPI.
  ```
- **Sample Values:**
  - `{{1}}`: `Suresh Bhai`
  - `{{2}}`: `SH-8821`
  - `{{3}}`: `National Packaging Industries`
  - `{{4}}`: `1,25,000`
  - `{{5}}`: `Today`
- **Buttons:**
  1. **URL Button:** `Pay ₹{{1}} with UPI` -> `https://wasool.io/pay/{{1}}`
  2. **Quick Reply:** `Already Paid (Share UTR)`

---

## 3. Template 3: `wasool_reconcile_t3` (T+3 Overdue Follow-up)
*Sent 3 days post due date to catch UTR transfers already initiated by the buyer's accountant.*

- **Template Name:** `wasool_reconcile_t3`
- **Category:** `UTILITY`
- **Body:**
  ```text
  Hi {{1}},
  
  Our automated munshi shows Invoice #{{2}} for ₹{{3}} from {{4}} is now 3 days overdue.
  
  If your accounts team has already transferred this amount via NEFT / RTGS / Cheque, please reply to this chat with the 12-digit UTR number or screenshot so we can update your ledger.
  
  Otherwise, please clear the pending balance today.
  ```
- **Sample Values:**
  - `{{1}}`: `Vikram Patel`
  - `{{2}}`: `INV-441`
  - `{{3}}`: `84,000`
  - `{{4}}`: `Apex Electricals`
- **Buttons:**
  1. **URL Button:** `Pay Pending Balance` -> `https://wasool.io/pay/{{1}}`
  2. **Quick Reply:** `I Paid (Share UTR)`

---

## 4. Template 4: `wasool_formal_notice_t7` (T+7 Formal Overdue Notice)
*Firm, polite, and formal reminder for 7 days overdue invoices.*

- **Template Name:** `wasool_formal_notice_t7`
- **Category:** `UTILITY`
- **Header:** `DOCUMENT`
- **Body:**
  ```text
  Attention: Accounts Department, {{1}}.
  
  This is a formal communication from {{2}} regarding overdue Invoice #{{3}} amounting to ₹{{4}}, which matured on {{5}} (7 days overdue).
  
  Our dispatch system will be required to hold further credit dispatches pending reconciliation of this bill. Kindly ensure settlement today via the secure link below.
  ```
- **Buttons:**
  1. **URL Button:** `Settle Bill Immediately` -> `https://wasool.io/pay/{{1}}`

---

## 5. Template 5: `wasool_suspension_alert_t15` (T+15 Critical Credit Hold)
*Final escalation before business suspension or legal collection escalation.*

- **Template Name:** `wasool_suspension_alert_t15`
- **Category:** `UTILITY`
- **Body:**
  ```text
  URGENT NOTICE — Ledger Credit Alert
  
  Dear {{1}},
  
  Invoice #{{2}} (₹{{3}}) with {{4}} is now 15 days past due. As per standard commercial terms, further goods dispatch and new order processing for your account have been placed on temporary hold.
  
  To restore active credit status and prevent interest accrual, please clear the dues immediately.
  ```
- **Buttons:**
  1. **URL Button:** `Clear Dues Now` -> `https://wasool.io/pay/{{1}}`

---

## 6. Template 6: `wasool_owner_approval_card` (Staff Ingestion Approval)
*Sent to the Business Owner whenever dispatch staff forwards a bill photo.*

- **Template Name:** `wasool_owner_approval_card`
- **Category:** `UTILITY`
- **Header:** `IMAGE` (Photo of bill forwarded by staff)
- **Body:**
  ```text
  🔔 New Bill Submission by Staff ({{1}})
  
  • Buyer: {{2}} ({{3}})
  • Amount: ₹{{4}}
  • Invoice #: {{5}}
  • Due Date: {{6}}
  
  Tap below to approve automated WhatsApp Tagada Munshi for this invoice.
  ```
- **Buttons:**
  1. **Quick Reply:** `✅ Start Munshi`
  2. **Quick Reply:** `✏️ Edit Bill`
  3. **Quick Reply:** `❌ Reject`
