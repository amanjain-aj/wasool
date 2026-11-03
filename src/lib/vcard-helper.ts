// lib/vcard-helper.ts — Native WhatsApp Contact Card (vCard) Parser (v2.1)

export interface ExtractedWhatsAppContact {
  name: string;
  phone: string; // Standardized +91XXXXXXXXXX
}

export function extractContactsFromWebhook(contactsPayload: any[]): ExtractedWhatsAppContact[] {
  if (!Array.isArray(contactsPayload)) return [];

  const extracted: ExtractedWhatsAppContact[] = [];

  for (const contact of contactsPayload) {
    const rawName = contact?.name?.formatted_name || contact?.name?.first_name || "Unknown Party";
    const rawPhone = contact?.phones?.[0]?.phone || contact?.phones?.[0]?.wa_id || "";

    const digits = rawPhone.replace(/\D/g, "");
    let normalizedPhone = "";
    if (digits.length === 10) {
      normalizedPhone = `+91${digits}`;
    } else if (digits.length === 12 && digits.startsWith("91")) {
      normalizedPhone = `+${digits}`;
    }

    if (normalizedPhone) {
      extracted.push({ name: rawName.trim(), phone: normalizedPhone });
    }
  }

  return extracted;
}
