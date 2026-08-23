"use client";

import { useState } from "react";

export default function ContactCard({
  profileId,
  loggedIn,
  initiallyUnlocked,
  maskedPhone,
  maskedAddress,
  phone,
  address,
}: {
  profileId: string;
  loggedIn: boolean;
  initiallyUnlocked: boolean;
  maskedPhone: string;
  maskedAddress: string;
  phone: string;
  address: string;
}) {
  const [unlocked, setUnlocked] = useState(initiallyUnlocked);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUnlock() {
    if (!loggedIn) {
      window.location.href = `/masuk?next=/mitra/${profileId}`;
      return;
}
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/professionals/${profileId}/unlock-contact`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Gagal membuka kontak. Coba lagi.");
}
      setUnlocked(true);
} catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan.");
} finally {
      setLoading(false);
}
}

  return (
    <div className="card p-6 sticky top-6">
      <h3 className="font-semibold mb-3">Kontak & alamat</h3>

      <div className="flex items-center gap-2.5 py-3 border-b border-bordersoft">
        <div className="w-8 h-8 rounded-lg bg-surface2 flex items-center justify-center text-inkfaint shrink-0">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M4 5h4l2 5-2.5 1.5a11 11 0 005 5L14 14l5 2v4a2 2 0 01-2.2 2A16 16 0 014 7.2 2 2 0 016 5z" stroke="currentColor" strokeWidth="1.6" /></svg>
        </div>
        <div>
          <div className="text-[11px] text-inkfaint uppercase tracking-wide">Telepon</div>
          <div className="font-mono text-sm text-inksoft">{unlocked ? phone : maskedPhone}</div>
        </div>
      </div>
      <div className="flex items-center gap-2.5 py-3">
        <div className="w-8 h-8 rounded-lg bg-surface2 flex items-center justify-center text-inkfaint shrink-0">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-6.6 7-11.5A7 7 0 105 9.5C5 14.4 12 21 12 21z" stroke="currentColor" strokeWidth="1.6" /></svg>
        </div>
        <div>
          <div className="text-[11px] text-inkfaint uppercase tracking-wide">Alamat</div>
          <div className="font-mono text-sm text-inksoft">{unlocked ? address : maskedAddress}</div>
        </div>
      </div>

{!unlocked && (
        <>
          <div className="flex gap-2.5 bg-warnsoft border border-[#F3D9AE] rounded-lg p-3.5 text-sm text-warn my-3.5 leading-snug">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5"><rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.7" /><path d="M8 10V7a4 4 0 118 0v3" stroke="currentColor" strokeWidth="1.7" /></svg>
{loggedIn
              ? "Buka kontak untuk melihat nomor & alamat lengkap. Setiap pembukaan kontak tercatat di jejak audit kami."
              : "Verifikasi akun Anda (HP/email) untuk membuka kontak lengkap & alamat penuh mitra ini."}
          </div>
{error && <div className="text-sm text-danger mb-3">{error}</div>}
          <button
            onClick={handleUnlock}
            disabled={loading}
            className="w-full bg-accent text-white font-semibold text-sm py-3 rounded-lg disabled:opacity-60"
          >
{loading ? "Memproses…" : loggedIn ? "Buka Kontak" : "Verifikasi Akun Saya"}
          </button>
        </>
      )}

      <div className="text-xs text-inkfaint text-center mt-3 leading-relaxed">
        Skor kepercayaan dihitung dari tingkat verifikasi, histori pekerjaan selesai, dan ulasan — bukan sekadar rating.
      </div>
    </div>
  );
}
