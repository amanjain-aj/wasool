// app/api/webhooks/whatsapp/route.ts
// Handles Meta Cloud API handshake, delivery receipts, and v2.0 Headless Munshi routing
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/config";
import { getStore } from "@/lib/store";
import { parseInboundBillOrVoice, parseDebtorPaymentProof } from "@/lib/munshi-ai";
import { sendOwnerApprovalMessage, sendOwnerReconciliationPrompt } from "@/lib/whatsapp-dispatcher";
import { ingestInvoice, settleInvoice } from "@/lib/services";
import { addDays, todayIST } from "@/lib/dates";
import axios from "axios";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const token = env.metaWebhookVerifyToken();
  if (token && p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === token) {
    return new NextResponse(p.get("hub.challenge") ?? "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

async function downloadWhatsAppMedia(mediaId: string): Promise<{ buffer: Buffer; mimeType: string }> {
  try {
    const res = await axios.get(`https://graph.facebook.com/v21.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${env.metaToken()}` }
    });
    const mediaUrl = res.data.url;
    const mimeType = res.data.mime_type;

    const fileRes = await axios.get(mediaUrl, {
      responseType: "arraybuffer",
      headers: { Authorization: `Bearer ${env.metaToken()}` }
    });

    return { buffer: Buffer.from(fileRes.data), mimeType };
  } catch (err) {
    console.error("[whatsapp-media-download-err]", err);
    return { buffer: Buffer.from("mock"), mimeType: "image/jpeg" };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const store = getStore();

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value;

        // 1. Process delivery receipts (SENT, DELIVERED, READ, FAILED)
        if (value?.statuses) {
          for (const s of value.statuses) {
            const statusUpper = s.status?.toUpperCase();
            if (["SENT", "DELIVERED", "READ", "FAILED"].includes(statusUpper)) {
              await store.updateDispatchByMessageId(s.id, {
                delivery_status: statusUpper as any,
                ...(statusUpper === "FAILED" ? { error_message: s.errors?.[0]?.message || "failed" } : {})
              });
            }
          }
        }

        // 2. Process incoming messages (Buttons, Images, Documents, Audio)
        if (value?.messages) {
          for (const msg of value.messages) {
            const senderPhone = `+${msg.from}`;
            const today = todayIST();

            // Priority 1: Interactive Button / List Reply
            if (msg.type === "interactive") {
              const replyId: string =
                msg.interactive?.button_reply?.id || msg.interactive?.list_reply?.id || "";

              if (replyId.startsWith("APPROVE_INV_")) {
                const invoiceId = replyId.replace("APPROVE_INV_", "");
                await store.updateInvoice(invoiceId, { status: "PENDING", autopilot_enabled: true });
                console.info(`[munshi] Owner approved invoice ${invoiceId}`);
              } else if (replyId.startsWith("CANCEL_INV_")) {
                const invoiceId = replyId.replace("CANCEL_INV_", "");
                await store.updateInvoice(invoiceId, { status: "CANCELLED", autopilot_enabled: false });
                console.info(`[munshi] Owner cancelled invoice ${invoiceId}`);
              } else if (replyId.startsWith("CONFIRM_FULL_")) {
                const recId = replyId.replace("CONFIRM_FULL_", "");
                const rec = await store.getReconciliation(recId);
                if (rec) {
                  await store.updateReconciliation(recId, { status: "CONFIRMED", confirmed_at: new Date().toISOString() });
                  await settleInvoice(rec.invoice_id, {
                    utr_reference: rec.utr_or_cheque_number || "CONFIRMED_BY_OWNER"
                  });
                }
              } else if (replyId.startsWith("CONFIRM_PART_")) {
                const recId = replyId.replace("CONFIRM_PART_", "");
                const rec = await store.getReconciliation(recId);
                if (rec) {
                  await store.updateReconciliation(recId, { status: "CONFIRMED", confirmed_at: new Date().toISOString() });
                  await settleInvoice(rec.invoice_id, {
                    utr_reference: rec.utr_or_cheque_number || "PART_PAYMENT_OWNER",
                    amount_paid: rec.reported_amount_inr
                  });
                }
              } else if (replyId.startsWith("PAUSE_DEBTOR_")) {
                const debtorId = replyId.replace("PAUSE_DEBTOR_", "");
                await store.pauseDebtor(debtorId, addDays(today, 3));
              }
              continue;
            }

            // Priority 2 & 4: Inbound Debtor with payment screenshot or UTR
            const debtorLookup = await store.findDebtorByPhone(senderPhone);
            const isMedia = ["image", "document", "audio"].includes(msg.type);

            if (debtorLookup && debtorLookup.activeInvoices.length > 0 && isMedia) {
              const mediaId = msg.image?.id || msg.document?.id;
              const caption = msg.image?.caption || msg.text?.body || "";
              const { buffer, mimeType } = await downloadWhatsAppMedia(mediaId);

              const proof = await parseDebtorPaymentProof(buffer, mimeType, caption);
              if (proof.is_payment_proof) {
                const targetInvoice = debtorLookup.activeInvoices[0];
                const rec = await store.createReconciliation({
                  invoice_id: targetInvoice.id,
                  reported_amount_inr: proof.reported_amount_inr,
                  utr_or_cheque_number: proof.utr_or_cheque_number
                });

                await sendOwnerReconciliationPrompt(targetInvoice.tenant.owner_phone, rec.id, {
                  clientName: debtorLookup.debtor.client_name,
                  invoiceNumber: targetInvoice.invoice_number,
                  reportedAmount: proof.reported_amount_inr,
                  pendingAmount: targetInvoice.amount_pending_inr,
                  utr: proof.utr_or_cheque_number
                });
                continue;
              }
            }

            // Priority 3: Sender is Owner or Staff submitting a bill
            const tenantOwner = await store.findTenantByPhone(senderPhone);
            const staffLookup = !tenantOwner ? await store.findStaffByPhone(senderPhone) : null;
            const activeTenant = tenantOwner || staffLookup?.tenant;

            if (activeTenant && isMedia) {
              const mediaId = msg.image?.id || msg.document?.id || msg.audio?.id || msg.voice?.id;
              const caption = msg.image?.caption || msg.document?.caption || "";
              const { buffer, mimeType } = await downloadWhatsAppMedia(mediaId);

              const extracted = await parseInboundBillOrVoice(buffer, mimeType, caption, today);
              const requireApproval = staffLookup ? staffLookup.staff.require_owner_approval : false;

              const ingestResult = await ingestInvoice({
                tenant: activeTenant,
                debtor: {
                  client_name: extracted.party_name,
                  phone: extracted.party_phone || "+919876543210"
                },
                invoice: {
                  invoice_number: extracted.invoice_number,
                  amount_total_inr: extracted.amount_inr,
                  amount_pending_inr: extracted.amount_inr,
                  issue_date: today,
                  due_date: extracted.due_date_iso || addDays(today, extracted.credit_days || 7),
                  autopilot_enabled: !requireApproval
                }
              });

              if (requireApproval) {
                await store.updateInvoice(ingestResult.invoice.id, {
                  status: "AWAITING_OWNER_APPROVAL",
                  autopilot_enabled: false
                });

                await sendOwnerApprovalMessage(activeTenant.owner_phone, ingestResult.invoice.id, {
                  partyName: extracted.party_name,
                  invoiceNumber: extracted.invoice_number,
                  amount: extracted.amount_inr,
                  dueDate: extracted.due_date_iso,
                  docType: extracted.doc_type
                });
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("[whatsapp-webhook-error]", err);
  }

  return NextResponse.json({ ok: true });
}
