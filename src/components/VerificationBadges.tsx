export function VerificationBadges({ badges }: { badges: { identitas: boolean; alamat: boolean; keahlian: boolean } }) {
  return (
        <div className="flex gap-1.5 flex-wrap">
    {badges.identitas && <span className="badge badge-good">✓ Identitas</span>}
{badges.alamat && <span className="badge badge-good">✓ Alamat</span>}
{badges.keahlian && <span className="badge badge-amber">✓ Keahlian</span>}
{!badges.identitas && !badges.alamat && !badges.keahlian && (
          <span className="badge badge-neutral">Verifikasi berjalan</span>
        )}
    </div>
    );
}

export function TrustPill({ label }: { label: string }) {
  const style =
    label === "Pilihan Utama"
      ? "bg-goodsoft text-good border-[#BFE4D0]"
      : label === "Terpercaya"
      ? "bg-accentsoft text-accentink border-[#C9D6F2]"
      : "bg-surface2 text-inksoft border-bordersoft";
  return <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${style}`}>{label}</span>;
}

export function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="text-[#A8631A]">
{"★".repeat(full)}
{"☆".repeat(Math.max(0, 5 - full))}
    </span>
  );
}
