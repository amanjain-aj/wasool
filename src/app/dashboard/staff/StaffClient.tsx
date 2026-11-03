"use client";

import { useState } from "react";
import { UserPlus, Trash2, ShieldCheck, CheckCircle2, Phone, AlertCircle, Loader2 } from "lucide-react";

export function StaffClient({ tenantId, initialStaff }: { tenantId: string; initialStaff: any[] }) {
  const [staffList, setStaffList] = useState(initialStaff);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [requireApproval, setRequireApproval] = useState(true);
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  async function handleAddStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setBusy(true);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          staff_name: name.trim(),
          staff_phone: phone.trim(),
          require_owner_approval: requireApproval,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add staff");

      setStaffList((prev) => [data.staff, ...prev]);
      setName("");
      setPhone("");
      setNotification(`Authorized ${data.staff.staff_name} for WhatsApp bill forwarding.`);
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error adding staff member");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteStaff(id: string) {
    if (!confirm("Revoke WhatsApp bill ingestion access for this staff member?")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/staff/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");

      setStaffList((prev) => prev.filter((s) => s.id !== id));
      setNotification("Staff member access revoked.");
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error removing staff member");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {notification && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 flex items-center justify-between">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="text-[10px] font-bold uppercase">
            Dismiss
          </button>
        </div>
      )}

      {/* Add Staff Form */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
          <UserPlus className="h-4 w-4 text-emerald-400" /> Authorize Dispatch Clerk or Munim
        </h2>

        <form onSubmit={handleAddStaff} className="grid gap-4 sm:grid-cols-3 items-end">
          <div>
            <label className="label">Staff Name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ramesh (Dispatch Clerk)"
              required
            />
          </div>

          <div>
            <label className="label">WhatsApp Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                className="input pl-9 font-mono"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+9198XXXXXXXX"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="btn-primary h-10 flex items-center justify-center gap-1.5 text-xs"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Grant Ingestion Access
          </button>
        </form>

        <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
          <input
            type="checkbox"
            id="require_owner_approval"
            checked={requireApproval}
            onChange={(e) => setRequireApproval(e.target.checked)}
            className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0"
          />
          <label htmlFor="require_owner_approval" className="cursor-pointer">
            Require Owner 1-Tap WhatsApp Approval before any reminders are dispatched
          </label>
        </div>
      </div>

      {/* Staff List */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="text-sm font-bold text-white">Authorized Phone Numbers ({staffList.length})</div>
          <span className="text-xs text-slate-500">Can send bill photos directly to Wasool</span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {staffList.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No staff members authorized yet. Only the business owner can forward bills right now.
            </div>
          ) : (
            staffList.map((s) => (
              <div key={s.id} className="p-4 flex items-center justify-between hover:bg-slate-800/20 transition">
                <div>
                  <div className="font-bold text-white text-xs">{s.staff_name}</div>
                  <div className="font-mono text-[11px] text-slate-400 mt-0.5">{s.staff_phone}</div>
                </div>

                <div className="flex items-center gap-4">
                  {s.require_owner_approval ? (
                    <span className="rounded-full bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 text-[10px] font-bold text-sky-400">
                      Approval Required
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      Auto-Approved
                    </span>
                  )}

                  <button
                    onClick={() => handleDeleteStaff(s.id)}
                    disabled={deletingId === s.id}
                    className="p-1.5 rounded text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition"
                    title="Revoke Access"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
