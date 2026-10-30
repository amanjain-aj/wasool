// GET  /api/invoices?tenant_id=...  — dashboard data (invoices + recent dispatch log)
// POST /api/invoices                — bulk CSV/Excel import or manual entry
import { NextRequest, NextResponse } from "next/server";
import type { CsvInvoiceRow } from "@/types/wasool";
import { errorResponse, HttpError, readJson } from "@/lib/http";
import { getStore } from "@/lib/store";
import { csvRowToIngest, ingestInvoice } from "@/lib/services";
import { todayIST } from "@/lib/dates";

const MAX_ROWS = 2000;

export async function GET(req: NextRequest) {
  try {
    const tenantId = req.nextUrl.searchParams.get("tenant_id") || undefined;
    const store = getStore();
    const [invoices, recent] = await Promise.all([store.listInvoices(tenantId), store.listRecentDispatches(25, tenantId)]);
    return NextResponse.json({ today: todayIST(), invoices, recent_dispatches: recent });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await readJson<{ tenant_id: string; rows: CsvInvoiceRow[] }>(req);
    if (!body?.tenant_id) throw new HttpError(422, "tenant_id is required");
    if (!Array.isArray(body.rows) || body.rows.length === 0) throw new HttpError(422, "rows[] is required");
    if (body.rows.length > MAX_ROWS) throw new HttpError(413, `Max ${MAX_ROWS} rows per import`);

    const tenant = await getStore().getTenant(body.tenant_id);
    if (!tenant) throw new HttpError(404, "Tenant not found");

    const imported: Array<{ row: number; invoice_number: string; invoice_id: string; reminders: number }> = [];
    const errors: Array<{ row: number; invoice_number?: string; error: string }> = [];

    for (const [i, row] of body.rows.entries()) {
      try {
        const res = await ingestInvoice(csvRowToIngest(tenant, row));
        imported.push({ row: i + 1, invoice_number: res.invoice.invoice_number, invoice_id: res.invoice.id, reminders: res.scheduled.length });
      } catch (err) {
        errors.push({ row: i + 1, invoice_number: row?.invoice_number, error: err instanceof Error ? err.message : String(err) });
      }
    }

    return NextResponse.json({ imported: imported.length, failed: errors.length, results: imported, errors }, { status: errors.length && !imported.length ? 422 : 200 });
  } catch (err) {
    return errorResponse(err);
  }
}
