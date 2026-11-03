// app/api/webhooks/whatsapp/route.ts
// Handles Meta Cloud API handshake, delivery receipts, and v2.1 Headless Munshi routing
import { NextRequest, NextResponse } from "next/server";
import { env, isWhatsAppLive } from "@/lib/config";
import { getStore } from "@/lib/store";
import { parseUnifiedMunshiInput, parseDebtorPaymentProof } from "@/lib/munshi-ai";
import { extractContactsFromWebhook } from "@/lib/vcard-helper";
import {
  sendOwnerApprovalMessage,
  sendOwnerBatchApprovalMessage,
  sendOwnerReconciliationPrompt
} from "@/lib/whatsapp-dispatcher";
import { ingestInvoice, settleInvoice } from "@/lib/services";
import { addDays, todayIST } from "@/lib/dates";
import axios from "axios";
import { randomUUID } from "node:crypto";

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

async function sendWhatsAppReply(toPhone: string, text: string) {
  if (!isWhatsAppLive()) {
    console.info(`[whatsapp-reply:dry-run] to ${toPhone}: ${text}`);
    return;
  }
  try {
    await axios.post(
      `https://graph.facebook.com/v21.0/${process.env.META_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: toPhone.replace("+", ""),
        type: "text",
        text: { body: text }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.META_SYSTEM_USER_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (err) {
    console.error("[whatsapp-reply-error]", err);
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

        // 2. Process incoming messages (Interactive, Contacts, Images, Docs, Audio, Text)
        if (value?.messages) {
          for (const msg of value.messages) {
            const senderPhone = `+${msg.from}`;
            const today = todayIST();

            // =========================================================================
            // Priority 1: Interactive Button / List Reply
            // =========================================================================
            if (msg.type === "interactive") {
              const replyId: string =
                msg.interactive?.button_reply?.id || msg.interactive?.list_reply?.id || "";

              if (replyId.startsWith("APPROVE_INV_")) {
                const invoiceId = replyId.replace("APPROVE_INV_", "");
                await store.updateInvoice(invoiceId, { status: "PENDING", autopilot_enabled: true });
                await sendWhatsAppReply(senderPhone, "✅ Bill approved! Automated WhatsApp follow-up is now active.");
              } else if (replyId.startsWith("APPROVE_BATCH_")) {
                const batchId = replyId.replace("APPROVE_BATCH_", "");
                const count = await store.approveBatch(batchId);
                await sendWhatsAppReply(senderPhone, `✅ Approved! All ${count} parties have been activated for follow-ups.`);
              } else if (replyId.startsWith("CANCEL_INV_")) {
                const invoiceId = replyId.replace("CANCEL_INV_", "");
                await store.updateInvoice(invoiceId, { status: "CANCELLED", autopilot_enabled: false });
                await sendWhatsAppReply(senderPhone, "❌ Follow-up cancelled for this bill.");
              } else if (replyId.startsWith("CANCEL_BATCH_")) {
                await sendWhatsAppReply(senderPhone, "❌ Batch import cancelled.");
              } else if (replyId.startsWith("CONFIRM_FULL_")) {
                const recId = replyId.replace("CONFIRM_FULL_", "");
                const rec = await store.getReconciliation(recId);
                if (rec) {
                  await store.updateReconciliation(recId, { status: "CONFIRMED", confirmed_at: new Date().toISOString() });
                  await settleInvoice(rec.invoice_id, {
                    utr_reference: rec.utr_or_cheque_number || "CONFIRMED_BY_OWNER"
                  });
                  await sendWhatsAppReply(senderPhone, "✅ Payment confirmed. Invoice marked as PAID and reminders halted.");
                }
              } else if (replyId.startsWith("CONFIRM_PART_")) {
                const recId = replyId.replace("CONFIRM_PART_", "");
                const rec = await store.getReconciliation(recId);
                if (rec) {
                  await store.updateReconciliation(recId, { status: "CONFIRMED", confirmed_at: new Date().toISOString() });
                  const res = await settleInvoice(rec.invoice_id, {
                    utr_reference: rec.utr_or_cheque_number || "PART_PAYMENT_OWNER",
                    amount_paid: rec.reported_amount_inr
                  });
                  await sendWhatsAppReply(
                    senderPhone,
                    `➗ Part payment of ₹${rec.reported_amount_inr} recorded. Remaining balance: ₹${res.invoice.amount_pending_inr}.`
                  );
                }
              } else if (replyId.startsWith("REJECT_PAY_")) {
                const recId = replyId.replace("REJECT_PAY_", "");
                await store.updateReconciliation(recId, { status: "REJECTED" });
                await sendWhatsAppReply(senderPhone, "⚠️ Payment rejected. Reminders will continue according to schedule.");
              } else if (replyId.startsWith("PAUSE_DEBTOR_")) {
                const debtorId = replyId.replace("PAUSE_DEBTOR_", "");
                await store.pauseDebtor(debtorId, addDays(today, 3));
                await sendWhatsAppReply(senderPhone, "⏸️ Party paused for 3 days. No follow-ups will be sent until then.");
              }
              continue;
            }

            // =========================================================================
            // Priority 2: Direct Reply to an Outbound Reminder (context.id present)
            // =========================================================================
            const isMedia = ["image", "document", "audio", "voice"].includes(msg.type);

            if (msg.context?.id && isMedia) {
              const mediaId = msg.image?.id || msg.document?.id;
              const caption = msg.image?.caption || msg.text?.body || "";
              const { buffer, mimeType } = await downloadWhatsAppMedia(mediaId);

              const proof = await parseDebtorPaymentProof(buffer, mimeType, caption);
              if (proof.is_payment_proof) {
                const debtorLookup = await store.findDebtorByPhone(senderPhone);
                if (debtorLookup && debtorLookup.activeInvoices.length > 0) {
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

                  await sendWhatsAppReply(
                    senderPhone,
                    `🙏 Thank you! We received your payment proof (Ref: ${proof.utr_or_cheque_number}). Our accounts desk will verify and reconcile your ledger.`
                  );
                  continue;
                }
              }
            }

            // =========================================================================
            // Priority 3: Sender is Owner or Authorized Dispatch Staff
            // =========================================================================
            const tenantOwner = await store.findTenantByPhone(senderPhone);
            const staffLookup = !tenantOwner ? await store.findStaffByPhone(senderPhone) : null;
            const activeTenant = tenantOwner || staffLookup?.tenant;

            if (activeTenant) {
              // Sub-case A: Native WhatsApp Contact Card (`vCard`) shared
              if (msg.type === "contacts") {
                const contacts = extractContactsFromWebhook(msg.contacts);
                if (contacts.length > 0) {
                  const primaryContact = contacts[0];
                  const existingSession = await store.getSessionContext(senderPhone);

                  // If an invoice was waiting for a contact number
                  if (existingSession?.pending_invoice_id) {
                    const inv = await store.getInvoice(existingSession.pending_invoice_id);
                    if (inv) {
                      await store.upsertDebtor({
                        tenant_id: activeTenant.id,
                        client_name: primaryContact.name,
                        phone: primaryContact.phone
                      });
                      await store.updateInvoice(inv.id, {
                        status: "AWAITING_OWNER_APPROVAL"
                      });
                      await store.clearSessionContext(senderPhone);

                      await sendOwnerApprovalMessage(activeTenant.owner_phone, inv.id, {
                        partyName: primaryContact.name,
                        invoiceNumber: inv.invoice_number,
                        amount: inv.amount_pending_inr,
                        dueDate: inv.due_date,
                        docType: inv.doc_type || "VOICE_ENTRY"
                      });
                      continue;
                    }
                  }

                  // Otherwise, store in session for the next 5 mins
                  await store.setSessionContext(senderPhone, activeTenant.id, {
                    last_shared_contact_name: primaryContact.name,
                    last_shared_contact_phone: primaryContact.phone
                  });

                  await sendWhatsAppReply(
                    senderPhone,
                    `👍 Got *${primaryContact.name}* (${primaryContact.phone}). Now send the bill photo, voice note, or amount.`
                  );
                  continue;
                }
              }

              // Sub-case B: Multimodal Input (Photo, PDF, Voice Note, or Text)
              if (isMedia || msg.type === "text") {
                let fileBuffer: Buffer | null = null;
                let mimeType: string | null = null;
                let captionText = msg.text?.body || "";

                if (isMedia) {
                  const mediaId = msg.image?.id || msg.document?.id || msg.audio?.id || msg.voice?.id;
                  captionText = msg.image?.caption || msg.document?.caption || "";
                  const downloaded = await downloadWhatsAppMedia(mediaId);
                  fileBuffer = downloaded.buffer;
                  mimeType = downloaded.mimeType;
                }

                // Check for paired contact card sent right before
                const session = await store.getSessionContext(senderPhone);
                const pairedContact = session?.last_shared_contact_name
                  ? { name: session.last_shared_contact_name, phone: session.last_shared_contact_phone }
                  : null;

                const extracted = await parseUnifiedMunshiInput(fileBuffer, mimeType, captionText, today, pairedContact);
                const requireApproval = staffLookup ? staffLookup.staff.require_owner_approval : true;

                // Handle Bulk Ingestion (Khatabook PDF, Diary Page, or Multi-Party Voice Note)
                if (extracted.is_bulk_list && extracted.entries.length > 1) {
                  const batchImportId = randomUUID();
                  let totalBatchAmount = 0;
                  const sampleParties: string[] = [];

                  for (const entry of extracted.entries) {
                    let phone = entry.party_phone;
                    if (!phone) {
                      const matched = await store.findDebtorByNameFuzzy(activeTenant.id, entry.party_name);
                      if (matched) phone = matched.phone;
                    }

                    totalBatchAmount += entry.amount_inr;
                    sampleParties.push(`${entry.party_name} (₹${entry.amount_inr.toLocaleString("en-IN")})`);

                    const res = await ingestInvoice({
                      tenant: activeTenant,
                      debtor: {
                        client_name: entry.party_name,
                        phone: phone || "+919876543210" // placeholder if unknown
                      },
                      invoice: {
                        invoice_number: entry.invoice_number,
                        amount_total_inr: entry.amount_inr,
                        amount_pending_inr: entry.amount_inr,
                        issue_date: today,
                        due_date: entry.due_date_iso || today,
                        autopilot_enabled: false
                      }
                    });

                    await store.updateInvoice(res.invoice.id, {
                      batch_import_id: batchImportId,
                      doc_type: extracted.source_doc_type,
                      status: "AWAITING_OWNER_APPROVAL"
                    });
                  }

                  await sendOwnerBatchApprovalMessage(activeTenant.owner_phone, batchImportId, {
                    totalParties: extracted.entries.length,
                    totalAmount: totalBatchAmount,
                    docType: extracted.source_doc_type.replace(/_/g, " "),
                    sampleParties
                  });
                  continue;
                }

                // Handle Single Bill / Single Entry
                if (extracted.entries.length > 0) {
                  const entry = extracted.entries[0];
                  let phone = entry.party_phone || pairedContact?.phone;

                  // Fuzzy lookup if phone not found
                  if (!phone) {
                    const matched = await store.findDebtorByNameFuzzy(activeTenant.id, entry.party_name);
                    if (matched) phone = matched.phone;
                  }

                  const res = await ingestInvoice({
                    tenant: activeTenant,
                    debtor: {
                      client_name: entry.party_name,
                      phone: phone || "+919876543210"
                    },
                    invoice: {
                      invoice_number: entry.invoice_number,
                      amount_total_inr: entry.amount_inr,
                      amount_pending_inr: entry.amount_inr,
                      issue_date: today,
                      due_date: entry.due_date_iso || addDays(today, entry.credit_days || 7),
                      autopilot_enabled: !requireApproval && !!phone
                    }
                  });

                  await store.updateInvoice(res.invoice.id, {
                    doc_type: extracted.source_doc_type
                  });

                  // If phone number is missing, prompt owner to attach Contact Card
                  if (!phone) {
                    await store.updateInvoice(res.invoice.id, {
                      status: "AWAITING_CONTACT_CARD",
                      autopilot_enabled: false
                    });
                    await store.setSessionContext(senderPhone, activeTenant.id, {
                      pending_invoice_id: res.invoice.id
                    });

                    await sendWhatsAppReply(
                      senderPhone,
                      `📋 *${entry.party_name}* ke liye ₹${entry.amount_inr.toLocaleString("en-IN")} note kar liya hai, par unka mobile number nahi mila.\n\n👇 Bas neeche 📎 -> *Contact* tap karein aur party ka WhatsApp Contact Card yahan share karein!`
                    );
                    continue;
                  }

                  // Normal approval flow
                  if (requireApproval) {
                    await store.updateInvoice(res.invoice.id, {
                      status: "AWAITING_OWNER_APPROVAL",
                      autopilot_enabled: false
                    });

                    await sendOwnerApprovalMessage(activeTenant.owner_phone, res.invoice.id, {
                      partyName: entry.party_name,
                      invoiceNumber: entry.invoice_number,
                      amount: entry.amount_inr,
                      dueDate: entry.due_date_iso,
                      docType: extracted.source_doc_type
                    });
                  } else {
                    await sendWhatsAppReply(
                      senderPhone,
                      `✅ *${entry.party_name}* (₹${entry.amount_inr.toLocaleString("en-IN")}) scheduled for automated follow-up on ${entry.due_date_iso}.`
                    );
                  }
                  continue;
                }
              }
            }

            // =========================================================================
            // Priority 4: Sender is an Active Debtor replying with Payment Proof
            // =========================================================================
            const debtorLookup = await store.findDebtorByPhone(senderPhone);
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

                await sendWhatsAppReply(
                  senderPhone,
                  `🙏 Thank you! We received your payment screenshot for Invoice #${targetInvoice.invoice_number}. Our accounts team is reconciling the ledger.`
                );
                continue;
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
