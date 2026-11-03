import "server-only";
import { getStore } from "./store";
import type { Tenant } from "@/types/wasool";

export interface PlanLimits {
  maxBillsPerMonth: number;
  maxStaffNumbers: number;
  allowCustomSenderId: boolean;
  allowExcelExport: boolean;
  planName: string;
  monthlyPriceINR: number;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  FREE_TRIAL: {
    maxBillsPerMonth: 15,
    maxStaffNumbers: 1,
    allowCustomSenderId: false,
    allowExcelExport: false,
    planName: "14-Day Free Pilot",
    monthlyPriceINR: 0,
  },
  munshi_standard: {
    maxBillsPerMonth: 100,
    maxStaffNumbers: 2,
    allowCustomSenderId: false,
    allowExcelExport: false,
    planName: "Munshi Standard",
    monthlyPriceINR: 999,
  },
  starter: {
    maxBillsPerMonth: 100,
    maxStaffNumbers: 2,
    allowCustomSenderId: false,
    allowExcelExport: false,
    planName: "Munshi Standard",
    monthlyPriceINR: 999,
  },
  munshi_vyapar_pro: {
    maxBillsPerMonth: 350,
    maxStaffNumbers: 5,
    allowCustomSenderId: true,
    allowExcelExport: true,
    planName: "Munshi Vyapar Pro",
    monthlyPriceINR: 2499,
  },
  growth: {
    maxBillsPerMonth: 350,
    maxStaffNumbers: 5,
    allowCustomSenderId: true,
    allowExcelExport: true,
    planName: "Munshi Vyapar Pro",
    monthlyPriceINR: 2499,
  },
  partner_embedded: {
    maxBillsPerMonth: 99999,
    maxStaffNumbers: 50,
    allowCustomSenderId: true,
    allowExcelExport: true,
    planName: "Embedded Partner Tier",
    monthlyPriceINR: 0,
  },
};

export interface TenantUsageSummary {
  tenantId: string;
  planKey: string;
  planName: string;
  billsUsedThisMonth: number;
  billsLimit: number;
  billsRemaining: number;
  staffUsed: number;
  staffLimit: number;
  usagePercentage: number;
  isOverQuota: boolean;
  cycleStartDate: string;
  cycleEndDate: string;
}

/**
 * Calculates current month usage for a tenant against their subscription tier.
 */
export async function getTenantUsage(tenantId: string): Promise<TenantUsageSummary> {
  const store = getStore();
  const tenant = await store.getTenant(tenantId);
  if (!tenant) {
    throw new Error(`Tenant not found: ${tenantId}`);
  }

  const planKey = tenant.subscription_plan || tenant.plan_tier || "FREE_TRIAL";
  const limits = PLAN_LIMITS[planKey] || PLAN_LIMITS.FREE_TRIAL;

  // Determine current month range in UTC/IST
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const startOfMonth = new Date(Date.UTC(year, month, 1)).toISOString();
  const endOfMonth = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59)).toISOString();

  // Load all invoices for tenant
  const invoices = await store.listInvoices(tenantId);
  const staff = await store.listStaff(tenantId);

  // Invoices created in current calendar cycle
  const billsThisMonth = invoices.filter((i) => {
    const created = (i as any).created_at || (i as any).issue_date;
    return created >= startOfMonth.slice(0, 10);
  }).length;

  const staffCount = staff.length;
  const remaining = Math.max(0, limits.maxBillsPerMonth - billsThisMonth);
  const usagePct = Math.min(100, Math.round((billsThisMonth / limits.maxBillsPerMonth) * 100));

  return {
    tenantId,
    planKey,
    planName: limits.planName,
    billsUsedThisMonth: billsThisMonth,
    billsLimit: limits.maxBillsPerMonth,
    billsRemaining: remaining,
    staffUsed: staffCount,
    staffLimit: limits.maxStaffNumbers,
    usagePercentage: usagePct,
    isOverQuota: billsThisMonth >= limits.maxBillsPerMonth,
    cycleStartDate: startOfMonth.slice(0, 10),
    cycleEndDate: endOfMonth.slice(0, 10),
  };
}

/**
 * Checks whether adding `incrementCount` new bills will exceed the tenant's quota.
 */
export async function checkCanIngestBills(
  tenantId: string,
  incrementCount: number = 1
): Promise<{ allowed: boolean; reason?: string; usage: TenantUsageSummary }> {
  const usage = await getTenantUsage(tenantId);

  if (usage.billsUsedThisMonth + incrementCount > usage.billsLimit) {
    return {
      allowed: false,
      reason: `Monthly quota exceeded: ${usage.billsUsedThisMonth}/${usage.billsLimit} bills used. Adding ${incrementCount} bills would exceed your ${usage.planName} allowance.`,
      usage,
    };
  }

  return {
    allowed: true,
    usage,
  };
}

/**
 * Checks whether a tenant can add a new staff member under their plan.
 */
export async function checkCanAddStaff(
  tenantId: string
): Promise<{ allowed: boolean; reason?: string; usage: TenantUsageSummary }> {
  const usage = await getTenantUsage(tenantId);

  if (usage.staffUsed >= usage.staffLimit) {
    return {
      allowed: false,
      reason: `Staff account limit reached (${usage.staffUsed}/${usage.staffLimit}). Upgrade to Munshi Vyapar Pro to authorize up to 5 dispatch clerk numbers.`,
      usage,
    };
  }

  return {
    allowed: true,
    usage,
  };
}
