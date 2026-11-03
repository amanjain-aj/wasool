// lib/whatsapp-dispatcher.ts — Proof-First Outbound Dispatcher (v2.0)
import axios from "axios";
import { isWhatsAppLive } from "./config";

export interface MunshiDispatchInput {
  recipientPhone: string;
  clientName: string;
  businessName: string;
  invoiceNumber: string;
  pendingAmount: number;
  dueDateFormatted: string;
  upiVpa: string;
  neftDetails?: string;
  mediaStorageUrl?: string | null;
  mediaMimeType?: string | null;
}

export function buildSafeUPILink(vpa: string, payeeName: string, amount: number, invNum: string): string {
  // NPCI UPI limit is ₹1,00,000 per standard intent transaction
  const safeAmount = Math.min(amount, 100000);
  const params = new URLSearchParams({
    pa: vpa,
    pn: payeeName.trim().slice(0, 25),
    am: safeAmount.toFixed(2),
    cu: "INR",
    tn: `Inv ${invNum}`
  });
  return `upi://pay?${params.toString()}`;
}

export async function dispatchMunshiReminder(input: MunshiDispatchInput) {
  const upiIntent = buildSafeUPILink(
    input.upiVpa,
    input.businessName,
    input.pendingAmount,
    input.invoiceNumber
  );

  if (!isWhatsAppLive()) {
    console.info(`[munshi-dispatch:dry-run] Sent to ${input.recipientPhone} for ${input.invoiceNumber}: ₹${input.pendingAmount}`);
    return { data: { messages: [{ id: `wamid.MUNSHI_DRYRUN.${Date.now()}` }] } };
  }

  const components: any[] = [];

  // Attach original bill photo or PDF header if available
  if (input.mediaStorageUrl) {
    const isPdf = input.mediaMimeType === "application/pdf";
    components.push({
      type: "header",
      parameters: [
        isPdf
          ? { type: "document", document: { link: input.mediaStorageUrl, filename: `Bill-${input.invoiceNumber}.pdf` } }
          : { type: "image", image: { link: input.mediaStorageUrl } }
      ]
    });
  }

  components.push({
    type: "body",
    parameters: [
      { type: "text", text: input.clientName },
      { type: "text", text: input.businessName },
      { type: "text", text: input.invoiceNumber },
      { type: "text", text: `₹${input.pendingAmount.toLocaleString("en-IN")}` },
      { type: "text", text: input.dueDateFormatted },
      { type: "text", text: input.neftDetails || `UPI ID: ${input.upiVpa}` }
    ]
  });

  components.push({
    type: "button",
    sub_type: "url",
    index: "0",
    parameters: [{ type: "text", text: encodeURIComponent(upiIntent) }]
  });

  const templateName = input.mediaStorageUrl
    ? "munshi_bill_reconciliation_media_v2"
    : "ar_reconciliation_check"; // Fallback to v1 template

  return await axios.post(
    `https://graph.facebook.com/v21.0/${process.env.META_PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to: input.recipientPhone.replace("+", ""),
      type: "template",
      template: {
        name: templateName,
        language: { code: "en" },
        components
      }
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.META_SYSTEM_USER_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );
}

/** Sends interactive buttons to owner for approval */
export async function sendOwnerApprovalMessage(
  ownerPhone: string,
  invoiceId: string,
  details: {
    partyName: string;
    invoiceNumber: string;
    amount: number;
    dueDate: string;
    docType: string;
    mediaUrl?: string | null;
  }
) {
  if (!isWhatsAppLive()) {
    console.info(`[munshi-approval:dry-run] Approval card sent to owner ${ownerPhone} for invoice ${invoiceId}`);
    return;
  }

  const bodyText = `📋 *Naya Bill Record Hua (Approval Chahiye)*\n\n` +
    `• Party: *${details.partyName}*\n` +
    `• Bill/Challan: *${details.invoiceNumber}*\n` +
    `• Amount: *₹${details.amount.toLocaleString("en-IN")}*\n` +
    `• Due Date: *${details.dueDate}*\n` +
    `• Type: ${details.docType}\n\n` +
    `Kya Munshi ko WhatsApp tagada shuru karne ki ijaazat hai?`;

  return await axios.post(
    `https://graph.facebook.com/v21.0/${process.env.META_PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to: ownerPhone.replace("+", ""),
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: bodyText },
        action: {
          buttons: [
            { type: "reply", reply: { id: `APPROVE_INV_${invoiceId}`, title: "✅ Start Munshi" } },
            { type: "reply", reply: { id: `CANCEL_INV_${invoiceId}`, title: "❌ Cancel" } }
          ]
        }
      }
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.META_SYSTEM_USER_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );
}

/** Sends interactive bulk batch approval card (e.g. Khatabook PDF or Diary Page) */
export async function sendOwnerBatchApprovalMessage(
  ownerPhone: string,
  batchImportId: string,
  summary: {
    totalParties: number;
    totalAmount: number;
    docType: string;
    sampleParties: string[];
  }
) {
  if (!isWhatsAppLive()) {
    console.info(`[munshi-batch-approval:dry-run] Batch ${batchImportId} (${summary.totalParties} parties, ₹${summary.totalAmount}) sent to ${ownerPhone}`);
    return;
  }

  const sampleList = summary.sampleParties.slice(0, 3).map((p, i) => `${i + 1}. ${p}`).join("\n");
  const bodyText = `📑 *Bulk Import: ${summary.totalParties} Parties Detected*\n\n` +
    `• Document: *${summary.docType}*\n` +
    `• Total Receivable: *₹${summary.totalAmount.toLocaleString("en-IN")}*\n` +
    `• Sample Entries:\n${sampleList}\n\n` +
    `Kya sabhi ${summary.totalParties} parties ke liye automated follow-up shuru karein?`;

  return await axios.post(
    `https://graph.facebook.com/v21.0/${process.env.META_PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to: ownerPhone.replace("+", ""),
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: bodyText },
        action: {
          buttons: [
            { type: "reply", reply: { id: `APPROVE_BATCH_${batchImportId}`, title: `✅ Start All (${summary.totalParties})` } },
            { type: "reply", reply: { id: `CANCEL_BATCH_${batchImportId}`, title: "❌ Cancel All" } }
          ]
        }
      }
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.META_SYSTEM_USER_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );
}

/** Sends interactive confirmation to owner when a debtor reports payment */
export async function sendOwnerReconciliationPrompt(
  ownerPhone: string,
  recId: string,
  details: {
    clientName: string;
    invoiceNumber: string;
    reportedAmount: number;
    pendingAmount: number;
    utr: string;
  }
) {
  if (!isWhatsAppLive()) {
    console.info(`[munshi-reconcile:dry-run] Prompt sent to owner ${ownerPhone} for rec ${recId}`);
    return;
  }

  const bodyText = `💰 *Payment Proof Received*\n\n` +
    `Party *${details.clientName}* ne Invoice #${details.invoiceNumber} ke liye ₹${details.reportedAmount.toLocaleString("en-IN")} payment report kiya hai.\n` +
    `• UTR/Ref: *${details.utr}*\n` +
    `• Total Pending: ₹${details.pendingAmount.toLocaleString("en-IN")}\n\n` +
    `Kya aapke bank account me paise aa gaye hain?`;

  return await axios.post(
    `https://graph.facebook.com/v21.0/${process.env.META_PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to: ownerPhone.replace("+", ""),
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: bodyText },
        action: {
          buttons: [
            { type: "reply", reply: { id: `CONFIRM_FULL_${recId}`, title: "✅ Confirm Full" } },
            { type: "reply", reply: { id: `CONFIRM_PART_${recId}`, title: "➗ Part-Payment" } },
            { type: "reply", reply: { id: `REJECT_PAY_${recId}`, title: "❌ Not Received" } }
          ]
        }
      }
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.META_SYSTEM_USER_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );
}
