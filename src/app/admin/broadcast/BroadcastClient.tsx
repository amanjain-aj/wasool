"use client";

import { useState } from "react";
import { Send, CheckCircle2, MessageSquare, Loader2, Info } from "lucide-react";
import type { Tenant } from "@/types/wasool";

export function BroadcastClient({ registeredCount }: { registeredCount: number }) {
  const [templateName, setTemplateName] = useState("munshi_platform_update");
  const [announcementText, setAnnouncementText] = useState(
    "Wasool Munshi Update: New 1-tap WhatsApp voice note & contact card parsing is now live for your account!"
  );
  const [targetGroup, setTargetGroup] = useState<"ALL_REGISTERED" | "FREE_TRIAL" | "PRO">("ALL_REGISTERED");
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  async function handleSendBroadcast(e: React.FormEvent) {
    e.preventDefault();
    if (!confirm(`Broadcast WhatsApp update to ${registeredCount} business owners?`)) return;

    setBusy(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateName,
          announcementText,
          targetGroup,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Broadcast failed");

      setStatusMessage(
        `✅ Broadcast complete: ${data.dispatched_count} messages sent ${data.dry_run ? "(Dry-Run Mode)" : ""}`
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error broadcasting message");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {statusMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 p-6 shadow-sm">
        <form onSubmit={handleSendBroadcast} className="space-y-5">
          <div>
            <label className="label">Target Audience</label>
            <select
              className="input"
              value={targetGroup}
              onChange={(e) => setTargetGroup(e.target.value as any)}
            >
              <option value="ALL_REGISTERED">All Active &amp; Registered Owners ({registeredCount} tenants)</option>
              <option value="FREE_TRIAL">Free Trial Tenants Only</option>
              <option value="PRO">Vyapar Pro / Growth Plan Tenants</option>
            </select>
            <p className="mt-1 text-[11px] text-slate-500">
              Only verified business owners who completed registration will receive the message.
            </p>
          </div>

          <div>
            <label className="label">Meta Approved Template Slug</label>
            <input
              className="input font-mono"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Announcement Copy / Body Parameter</label>
            <textarea
              className="input h-28"
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              required
            />
          </div>

          <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 text-xs text-sky-800 dark:text-sky-300 flex items-start gap-2">
            <Info className="h-4 w-4 shrink-0 text-sky-500 dark:text-sky-400 mt-0.5" />
            <div>
              Messages are dispatched via the official Meta WhatsApp Cloud API queue. If live Meta keys are not configured, dispatches run in Dry-Run simulation mode.
            </div>
          </div>

          <button
            type="submit"
            disabled={busy || registeredCount === 0}
            className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send Official WhatsApp Broadcast
          </button>
        </form>
      </div>
    </div>
  );
}
