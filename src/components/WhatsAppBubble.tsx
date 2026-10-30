import { CheckCheck, ExternalLink } from "lucide-react";

/** WhatsApp-style template bubble with the URL button used for UPI. */
export function WhatsAppBubble({
  sender,
  text,
  buttonLabel = "Pay via UPI",
  buttonHref,
  time = "10:30 AM",
}: {
  sender: string;
  text: string;
  buttonLabel?: string;
  buttonHref?: string;
  time?: string;
}) {
  return (
    <div className="rounded-2xl bg-[#0b141a] p-4">
      <div className="mb-3 flex items-center gap-2 border-b border-white/5 pb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
          {sender.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <div className="text-sm font-semibold text-white">{sender}</div>
          <div className="text-[10px] text-slate-400">Business account</div>
        </div>
      </div>
      <div className="max-w-[92%] overflow-hidden rounded-lg rounded-tl-none bg-[#202c33] shadow">
        <p className="whitespace-pre-wrap px-3 pt-2 text-[13px] leading-relaxed text-slate-100">{text}</p>
        <div className="flex items-center justify-end gap-1 px-3 pb-1.5 text-[10px] text-slate-400">
          {time} <CheckCheck className="h-3 w-3 text-sky-400" />
        </div>
        <a
          href={buttonHref}
          target={buttonHref?.startsWith("http") ? "_blank" : undefined}
          rel="noreferrer"
          className="flex items-center justify-center gap-1.5 border-t border-white/10 py-2 text-[13px] font-medium text-sky-400 hover:bg-white/5"
        >
          <ExternalLink className="h-3.5 w-3.5" /> {buttonLabel}
        </a>
      </div>
    </div>
  );
}
