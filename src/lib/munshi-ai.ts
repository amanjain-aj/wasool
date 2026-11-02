// lib/munshi-ai.ts — Multimodal Gemini Extraction for Wasool v2.0
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const billExtractionSchema = {
  type: SchemaType.OBJECT,
  properties: {
    party_name: { type: SchemaType.STRING, description: "Buyer firm or individual name" },
    party_phone: { type: SchemaType.STRING, description: "10-digit Indian phone prefixed with +91 if found, else empty string" },
    invoice_number: { type: SchemaType.STRING, description: "Bill or Challan number. Generate 'CH-YYYYMMDD' if not visible" },
    amount_inr: { type: SchemaType.NUMBER, description: "Total payable amount in INR" },
    credit_days: { type: SchemaType.NUMBER, description: "Credit days mentioned (e.g., '15 din credit'), default 7" },
    due_date_iso: { type: SchemaType.STRING, description: "Calculated YYYY-MM-DD due date" },
    doc_type: { type: SchemaType.STRING, enum: ["GST_INVOICE", "DELIVERY_CHALLAN", "KACCHA_ESTIMATE", "VOICE_ENTRY"] }
  },
  required: ["party_name", "invoice_number", "amount_inr", "due_date_iso", "doc_type"]
};

const utrExtractionSchema = {
  type: SchemaType.OBJECT,
  properties: {
    is_payment_proof: { type: SchemaType.BOOLEAN, description: "True if image/text is a bank/UPI receipt or cheque" },
    reported_amount_inr: { type: SchemaType.NUMBER, description: "Amount paid in INR" },
    utr_or_cheque_number: { type: SchemaType.STRING, description: "12-digit UPI Ref, UTR, IMPS, or Cheque number" },
    payment_date_iso: { type: SchemaType.STRING, description: "YYYY-MM-DD date of transaction" }
  },
  required: ["is_payment_proof", "reported_amount_inr", "utr_or_cheque_number"]
};

export interface ExtractedBill {
  party_name: string;
  party_phone: string;
  invoice_number: string;
  amount_inr: number;
  credit_days: number;
  due_date_iso: string;
  doc_type: "GST_INVOICE" | "DELIVERY_CHALLAN" | "KACCHA_ESTIMATE" | "VOICE_ENTRY";
}

export interface ExtractedPaymentProof {
  is_payment_proof: boolean;
  reported_amount_inr: number;
  utr_or_cheque_number: string;
  payment_date_iso?: string;
}

export async function parseInboundBillOrVoice(
  fileBuffer: Buffer,
  mimeType: string,
  captionText: string = "",
  currentDateISO: string
): Promise<ExtractedBill> {
  if (!genAI) {
    // Graceful fallback for local development without GEMINI_API_KEY
    console.warn("[munshi-ai] GEMINI_API_KEY missing, using mock extraction");
    return {
      party_name: captionText.split(" ")[0] || "Sample Merchant",
      party_phone: "+919876543210",
      invoice_number: `CH-${Date.now().toString().slice(-6)}`,
      amount_inr: 5000,
      credit_days: 7,
      due_date_iso: currentDateISO,
      doc_type: mimeType.includes("audio") ? "VOICE_ENTRY" : "DELIVERY_CHALLAN"
    };
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      // @ts-ignore - SchemaType definitions match Gemini API
      responseSchema: billExtractionSchema,
      temperature: 0.1
    }
  });

  const prompt = `
    You are an expert Indian B2B Accounts Munshi. Today's date is ${currentDateISO}.
    Extract billing details from the attached bill image, PDF, or Hinglish audio voice note, combined with caption: "${captionText}".
    - Format Indian mobile numbers as +91XXXXXXXXXX.
    - Calculate due_date_iso from ${currentDateISO} based on credit terms mentioned.
  `;

  const result = await model.generateContent([
    prompt,
    { inlineData: { data: fileBuffer.toString("base64"), mimeType } }
  ]);

  return JSON.parse(result.response.text());
}

export async function parseDebtorPaymentProof(
  fileBuffer: Buffer,
  mimeType: string,
  captionText: string = ""
): Promise<ExtractedPaymentProof> {
  if (!genAI) {
    console.warn("[munshi-ai] GEMINI_API_KEY missing, using mock proof extraction");
    return {
      is_payment_proof: true,
      reported_amount_inr: 5000,
      utr_or_cheque_number: `UTR${Date.now().toString().slice(-8)}`,
      payment_date_iso: new Date().toISOString().slice(0, 10)
    };
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      // @ts-ignore
      responseSchema: utrExtractionSchema,
      temperature: 0.1
    }
  });

  const prompt = `
    Analyze this WhatsApp image and caption ("${captionText}") sent by a debtor.
    Determine if it is a UPI screenshot, NEFT/RTGS/IMPS bank receipt, or cheque photo, and extract the paid amount and reference/UTR number.
  `;

  const result = await model.generateContent([
    prompt,
    { inlineData: { data: fileBuffer.toString("base64"), mimeType } }
  ]);

  return JSON.parse(result.response.text());
}
