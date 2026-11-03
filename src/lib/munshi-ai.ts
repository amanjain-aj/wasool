// lib/munshi-ai.ts — Unified Multimodal Gemini Extraction for Wasool v2.1
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const unifiedIngestionSchema = {
  type: SchemaType.OBJECT,
  properties: {
    is_bulk_list: {
      type: SchemaType.BOOLEAN,
      description: "True if input contains multiple debtors/bills (e.g. Khatabook multi-customer PDF, handwritten diary list, or multi-party voice note)"
    },
    source_doc_type: {
      type: SchemaType.STRING,
      enum: ["GST_INVOICE", "DELIVERY_CHALLAN", "KACCHA_ESTIMATE", "VOICE_ENTRY", "KHATABOOK_REPORT", "HANDWRITTEN_DIARY"]
    },
    entries: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          party_name: { type: SchemaType.STRING, description: "Buyer firm or individual name" },
          party_phone: { type: SchemaType.STRING, description: "Standardized +91XXXXXXXXXX if visible/spoken, else empty string" },
          invoice_number: { type: SchemaType.STRING, description: "Invoice/Challan No. Generate 'ENTRY-01' if diary/voice/report" },
          amount_inr: { type: SchemaType.NUMBER, description: "Net receivable/pending balance in INR (ignore settled/0 rows)" },
          credit_days: { type: SchemaType.NUMBER, description: "Credit period in days if specified, default 3 for reports/diary or 7 for fresh bills" },
          due_date_iso: { type: SchemaType.STRING, description: "Calculated YYYY-MM-DD due date" }
        },
        required: ["party_name", "invoice_number", "amount_inr", "due_date_iso"]
      }
    }
  },
  required: ["is_bulk_list", "source_doc_type", "entries"]
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

export interface UnifiedMunshiEntry {
  party_name: string;
  party_phone: string;
  invoice_number: string;
  amount_inr: number;
  credit_days?: number;
  due_date_iso: string;
}

export interface UnifiedMunshiOutput {
  is_bulk_list: boolean;
  source_doc_type: "GST_INVOICE" | "DELIVERY_CHALLAN" | "KACCHA_ESTIMATE" | "VOICE_ENTRY" | "KHATABOOK_REPORT" | "HANDWRITTEN_DIARY";
  entries: UnifiedMunshiEntry[];
}

export interface ExtractedPaymentProof {
  is_payment_proof: boolean;
  reported_amount_inr: number;
  utr_or_cheque_number: string;
  payment_date_iso?: string;
}

export async function parseUnifiedMunshiInput(
  fileBuffer: Buffer | null,
  mimeType: string | null,
  captionOrText: string = "",
  currentDateISO: string,
  pairedContact?: { name: string; phone: string } | null
): Promise<UnifiedMunshiOutput> {
  if (!genAI) {
    console.warn("[munshi-ai] GEMINI_API_KEY missing, using mock unified parser");
    const isMulti = captionOrText.includes(",") || captionOrText.toLowerCase().includes("khatabook");
    return {
      is_bulk_list: isMulti,
      source_doc_type: mimeType?.includes("audio") ? "VOICE_ENTRY" : isMulti ? "KHATABOOK_REPORT" : "DELIVERY_CHALLAN",
      entries: [
        {
          party_name: pairedContact?.name || captionOrText.split(" ")[0] || "Sample Merchant",
          party_phone: pairedContact?.phone || "+919876543210",
          invoice_number: `BILL-${Date.now().toString().slice(-6)}`,
          amount_inr: 15000,
          credit_days: 7,
          due_date_iso: currentDateISO
        }
      ]
    };
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      // @ts-ignore
      responseSchema: unifiedIngestionSchema,
      temperature: 0.1
    }
  });

  const contactContext = pairedContact
    ? `IMPORTANT: The user recently shared a WhatsApp Contact Card for "${pairedContact.name}" with phone "${pairedContact.phone}". Use this phone number/name if the bill or voice note doesn't explicitly contain another phone number.`
    : "";

  const prompt = `
    You are an expert Indian B2B Accounts Munshi. Today's date is ${currentDateISO}.
    ${contactContext}
    Analyze the attached input (Challan Photo, GST PDF, Khatabook/OkCredit/Vyapar Ledger Statement, Handwritten Bahi-Khata Diary Page, or Hinglish Voice Note) along with text: "${captionOrText}".
    
    RULES:
    1. If it is a Khatabook/Vyapar customer balance report or a handwritten notebook page listing multiple parties, extract EVERY row where the receivable balance ("You'll Get" / "Lena Hai") is greater than 0.
    2. If it is a voice note mentioning multiple parties (e.g., "Ramesh 20k, Suresh 35k"), split them into separate objects inside entries[].
    3. Format all valid 10-digit Indian phone numbers as +91XXXXXXXXXX. If a phone number is missing for any party, leave party_phone as "".
    4. Calculate due_date_iso from ${currentDateISO}. If it's an already-overdue Khatabook report or Udhaar diary entry without a future due date, set due_date_iso to ${currentDateISO}.
  `;

  const parts: any[] = [prompt];
  if (fileBuffer && mimeType) {
    parts.push({ inlineData: { data: fileBuffer.toString("base64"), mimeType } });
  }

  const result = await model.generateContent(parts);
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
