// /pay/[id] — target of the WhatsApp template URL button (`${APP_URL}/pay/{{1}}`).
// Opens the UPI intent on mobile; shows QR + details on desktop.
import { notFound } from "next/navigation";
import { CheckCircle2, ShieldCheck, Smartphone } from "lucide-react";
import { getStore } from "@/lib/store";
import { formatDateIN, formatINR } from "@/lib/dates";
import { UpiQr } from "@/components/UpiQr";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  const inv = await getStore().getInvoice(id);
  if (!inv) notFound();

  const paid = inv.status === "PAID";
  const closed = inv.status === "CANCELLED";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center">
        <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">Payment request from</div>
        <h1 className="mt-1 text-2xl font-bold text-white">{inv.tenant.brand_display_name}</h1>
        {inv.tenant.gstin && <div className="mt-1 text-xs text-slate-500">GSTIN {inv.tenant.gstin}</div>}

        <div className="my-6 rounded-2xl bg-slate-950 p-5">
          <div className="text-xs text-slate-400">Invoice #{inv.invoice_number} • Due {formatDateIN(inv.due_date)}</div>
          <div className="mt-2 text-4xl font-extrabold text-white">₹{formatINR(paid ? inv.amount_total_inr : inv.amount_pending_inr)}</div>
          <div className="mt-1 text-xs text-slate-500">Billed to {inv.debtor.client_name}</div>
        </div>

        {paid ? (
          <div className="flex flex-col items-center gap-2 text-emerald-400">
            <CheckCircle2 className="h-10 w-10" />
            <div className="font-semibold">Paid — thank you!</div>
            {inv.utr_reference && <div className="text-xs text-slate-400">UTR {inv.utr_reference}</div>}
          </div>
        ) : closed ? (
          <div className="text-sm text-slate-400">This invoice has been cancelled. No payment is due.</div>
        ) : (
          <>
            <a href={inv.payment_link_url ?? "#"} className="btn-primary w-full py-4 text-base">
              <Smartphone className="h-5 w-5" /> Pay with any UPI app
            </a>
            <p className="mt-2 text-xs text-slate-500">GPay • PhonePe • Paytm • BHIM — amount pre-filled</p>
            {inv.payment_link_url && (
              <div className="mt-6 flex flex-col items-center gap-2">
                <div className="rounded-xl bg-white p-2">
                  <UpiQr value={inv.payment_link_url} size={180} />
                </div>
                <div className="text-xs text-slate-500">On desktop? Scan with your phone&apos;s UPI app.</div>
                <div className="text-xs text-slate-500">
                  Paying to <span className="font-mono text-slate-300">{inv.tenant.upi_vpa}</span>
                </div>
              </div>
            )}
            <p className="mt-6 text-xs text-slate-500">Already paid? Reply to the WhatsApp message with your UTR number.</p>
          </>
        )}
      </div>
      <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-600">
        <ShieldCheck className="h-3.5 w-3.5" /> Secured by NPCI UPI • Powered by Wasool.io
      </div>
    </main>
  );
}
