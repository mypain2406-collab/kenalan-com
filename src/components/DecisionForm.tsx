"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DecisionForm({ verificationId, defaultNote }: { verificationId: string; defaultNote: string }) {
  const router = useRouter();
  const [note, setNote] = useState(defaultNote);
  const [loading, setLoading] = useState<"disetujui" | "ditolak" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(decision: "disetujui" | "ditolak") {
        setLoading(decision);
    setError(null);
    try {
      const res = await fetch(`/api/admin/verifications/${verificationId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, note }),
});
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Gagal menyimpan keputusan");
      }
      router.push("/admin/verifikasi");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setLoading(null);
      }
    }

  return (
        <div>
          <div className="text-xs text-inkfaint mb-1.5">Catatan peninjau</div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-surface2"
          />
    {error && <div className="text-sm text-danger mt-2">{error}</div>}
          <div className="flex gap-2.5 mt-4">
        <button
          onClick={() => decide("disetujui")}
                      disabled={loading !== null}
                      className="flex-1 bg-good text-white font-bold text-sm py-2.5 rounded-lg disabled:opacity-60"
                    >
            {loading === "disetujui" ? "Menyimpan…" : "✓ Setujui"}
        </button>
                    <button
                      onClick={() => decide("ditolak")}
                      disabled={loading !== null}
                      className="flex-1 bg-surface text-danger border border-[#F0C3BF] font-bold text-sm py-2.5 rounded-lg disabled:opacity-60"
                    >
            {loading === "ditolak" ? "Menyimpan…" : "✕ Tolak"}
        </button>
                  </div>
                </div>
              );
}
