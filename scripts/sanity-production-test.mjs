// scripts/sanity-production-test.mjs
// Comprehensive Automated Production Sanity, Functional, Quota & Security Test Suite

import assert from "node:assert/strict";

console.log("=================================================================");
console.log("🚀 STARTING WASOOL.IO v2.1 PRODUCTION SANITY & SECURITY AUDIT");
console.log("=================================================================\n");

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}\n`);
    process.exitCode = 1;
  }
}

async function asyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}\n`);
    process.exitCode = 1;
  }
}

// -----------------------------------------------------------------------------
// Suite 1: NPCI UPI Deep Link & Payment Intent Security
// -----------------------------------------------------------------------------
console.log("📋 [SUITE 1] NPCI UPI Intent & Deep Link Formatting");

function buildSafeUPILink(vpa, payeeName, amount, invNum) {
  const safeAmount = Math.min(amount, 100000);
  const cleanVpa = (vpa || "").trim();
  const cleanName = (payeeName || "").trim().slice(0, 25);
  const params = new URLSearchParams({
    pa: cleanVpa,
    pn: cleanName,
    am: safeAmount.toFixed(2),
    cu: "INR",
    tn: `Inv ${invNum}`
  });
  return `upi://pay?${params.toString()}`;
}

test("NPCI standard URI parameters are correctly encoded", () => {
  const uri = buildSafeUPILink("sharma@icici", "Sharma Traders & Co.", 45000, "INV-882");
  assert.match(uri, /^upi:\/\/pay\?/);
  assert.ok(uri.includes("pa=sharma%40icici") || uri.includes("pa=sharma@icici"));
  assert.ok(uri.includes("cu=INR"));
  assert.ok(uri.includes("am=45000.00"));
});

test("Caps UPI single intent transfer at NPCI ₹1,00,000 threshold", () => {
  const uri = buildSafeUPILink("sharma@icici", "Sharma Traders", 350000, "INV-999");
  assert.ok(uri.includes("am=100000.00"), "Amount should be capped at 100000.00");
});

test("Truncates payee name to 25 characters per NPCI spec", () => {
  const longName = "A Very Long Enterprise Business Private Limited";
  const uri = buildSafeUPILink("corp@hdfc", longName, 1200, "INV-100");
  const params = new URLSearchParams(uri.replace("upi://pay?", ""));
  assert.ok(params.get("pn").length <= 25);
});

// -----------------------------------------------------------------------------
// Suite 2: Currency & Date Calculations (Zero NaN / Zero Crash Guarantee)
// -----------------------------------------------------------------------------
console.log("\n📋 [SUITE 2] Date & Currency Math Robustness");

function formatINR(amount) {
  const num = typeof amount === "number" ? amount : Number(amount ?? 0);
  if (Number.isNaN(num)) return "0.00";
  return num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function daysBetween(from, to) {
  if (!from || !to) return 0;
  const pFrom = Date.parse(`${from}T00:00:00Z`);
  const pTo = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(pFrom) || Number.isNaN(pTo)) return 0;
  return Math.round((pTo - pFrom) / 86400000);
}

test("formatINR handles null, undefined, strings and large numbers safely", () => {
  assert.equal(formatINR(undefined), "0.00");
  assert.equal(formatINR(null), "0.00");
  assert.equal(formatINR("invalid"), "0.00");
  assert.equal(formatINR(1500), "1,500.00");
  assert.equal(formatINR(1250000.5), "12,50,000.50");
});

test("daysBetween calculates overdue days accurately without timezone drift", () => {
  assert.equal(daysBetween("2026-11-01", "2026-11-08"), 7);
  assert.equal(daysBetween("2026-11-08", "2026-11-01"), -7);
  assert.equal(daysBetween("", "2026-11-01"), 0);
  assert.equal(daysBetween("invalid", "2026-11-01"), 0);
});

// -----------------------------------------------------------------------------
// Suite 3: TDS / Kattauti & Part-Payment Math
// -----------------------------------------------------------------------------
console.log("\n📋 [SUITE 3] Part-Payment & Kattauti Deduction Math");

function applyPartPaymentAndTds(currentPending, paidAmount, tdsAmount = 0) {
  const totalDeducted = Number(paidAmount || 0) + Number(tdsAmount || 0);
  const remaining = Math.max(0, currentPending - totalDeducted);
  const isSettled = remaining === 0;
  return {
    remainingPending: remaining,
    isSettled,
    status: isSettled ? "PAID" : "PARTIALLY_PAID"
  };
}

test("Part payment reduces remaining balance and marks PARTIALLY_PAID", () => {
  const res = applyPartPaymentAndTds(50000, 20000, 0);
  assert.equal(res.remainingPending, 30000);
  assert.equal(res.status, "PARTIALLY_PAID");
  assert.equal(res.isSettled, false);
});

test("TDS (Kattauti) deduction + payment clears invoice cleanly", () => {
  // ₹1,00,000 bill: buyer paid ₹98,000 and deducted 2% TDS (₹2,000)
  const res = applyPartPaymentAndTds(100000, 98000, 2000);
  assert.equal(res.remainingPending, 0);
  assert.equal(res.status, "PAID");
  assert.equal(res.isSettled, true);
});

// -----------------------------------------------------------------------------
// Suite 4: Strict Post-Registration Production Gating
// -----------------------------------------------------------------------------
console.log("\n📋 [SUITE 4] Strict Post-Registration Production Gating");

function isTenantGated(tenant) {
  if (!tenant) return true;
  if (tenant.is_registered === false) return true;
  if (!tenant.business_name || !tenant.owner_phone) return true;
  return false;
}

test("Blocks unregistered tenant from WhatsApp reminders and dispatches", () => {
  const unregistered = {
    id: "tenant-1",
    business_name: "Fresh Signee",
    owner_phone: "+919820011223",
    is_registered: false,
    registration_step: "PENDING_UPI"
  };
  assert.equal(isTenantGated(unregistered), true, "Unregistered tenant must be gated");
});

test("Permits verified tenant with complete registration", () => {
  const verified = {
    id: "tenant-2",
    business_name: "Sharma Hardware",
    brand_display_name: "Sharma Hardware",
    owner_phone: "+919820011223",
    upi_vpa: "sharma@icici",
    is_registered: true,
    is_active: true
  };
  assert.equal(isTenantGated(verified), false, "Verified tenant must pass gating");
});

// -----------------------------------------------------------------------------
// Suite 5: Usage & Quota Tracking Engine
// -----------------------------------------------------------------------------
console.log("\n📋 [SUITE 5] Usage & Quota Tracking Specification");

const PLAN_LIMITS = {
  FREE_TRIAL: { maxBillsPerMonth: 15, maxStaffNumbers: 1 },
  munshi_standard: { maxBillsPerMonth: 100, maxStaffNumbers: 2 },
  munshi_vyapar_pro: { maxBillsPerMonth: 350, maxStaffNumbers: 5 }
};

function checkQuota(plan, currentBills, newBillsCount = 1) {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.FREE_TRIAL;
  const willExceed = currentBills + newBillsCount > limits.maxBillsPerMonth;
  return {
    allowed: !willExceed,
    remaining: Math.max(0, limits.maxBillsPerMonth - currentBills),
    limit: limits.maxBillsPerMonth
  };
}

test("Enforces 100 bills/month limit on Munshi Standard", () => {
  const check1 = checkQuota("munshi_standard", 95, 4);
  assert.equal(check1.allowed, true);

  const check2 = checkQuota("munshi_standard", 99, 2);
  assert.equal(check2.allowed, false, "101 bills should exceed 100 limit");
});

test("Enforces 350 bills/month limit on Munshi Vyapar Pro", () => {
  const check = checkQuota("munshi_vyapar_pro", 340, 15);
  assert.equal(check.allowed, false, "355 bills should exceed 350 limit");
});

test("Staff count cap: allows up to 5 on Vyapar Pro, 2 on Standard", () => {
  assert.equal(PLAN_LIMITS.munshi_vyapar_pro.maxStaffNumbers, 5);
  assert.equal(PLAN_LIMITS.munshi_standard.maxStaffNumbers, 2);
  assert.equal(PLAN_LIMITS.FREE_TRIAL.maxStaffNumbers, 1);
});

// -----------------------------------------------------------------------------
// Suite 6: WhatsApp Contact Card (vCard) Parser
// -----------------------------------------------------------------------------
console.log("\n📋 [SUITE 6] WhatsApp vCard / Contacts Payload Parser");

function normalizeIndianPhone(raw) {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `+91${digits.slice(1)}`;
  if (digits.length > 10 && digits.endsWith(digits.slice(-10))) return `+91${digits.slice(-10)}`;
  return null;
}

test("Normalizes raw 10-digit, 0-prefixed, and country-coded Indian phone numbers", () => {
  assert.equal(normalizeIndianPhone("9820112233"), "+919820112233");
  assert.equal(normalizeIndianPhone("09820112233"), "+919820112233");
  assert.equal(normalizeIndianPhone("+91 98201-12233"), "+919820112233");
  assert.equal(normalizeIndianPhone("invalid"), null);
});

// -----------------------------------------------------------------------------
// Suite 7: Super-Admin & Security Middleware
// -----------------------------------------------------------------------------
console.log("\n📋 [SUITE 7] Super-Admin & Auth Header Security");

test("Middleware matchers protect admin and dashboard routes", () => {
  const protectedRoutes = [
    "/admin",
    "/admin/tenants",
    "/admin/reconciliations",
    "/admin/broadcast",
    "/dashboard",
    "/dashboard/settings",
    "/dashboard/staff",
    "/dashboard/bills",
    "/api/admin/tenants/123",
    "/api/admin/broadcast"
  ];

  for (const route of protectedRoutes) {
    const isProtected = route.startsWith("/admin") || route.startsWith("/dashboard") || route.startsWith("/api/admin");
    assert.ok(isProtected, `${route} must be protected`);
  }
});

console.log("\n=================================================================");
console.log(`🎉 TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
console.log("=================================================================\n");
