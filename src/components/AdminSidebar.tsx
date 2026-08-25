import Link from "next/link";

const NAV: { key: "verifikasi" | "mitra" | "kategori"; href: string; label: string }[] = [
  { key: "verifikasi", href: "/admin/verifikasi", label: "Antrean Verifikasi" },
  { key: "mitra", href: "/admin/mitra", label: "Data Mitra" },
  { key: "kategori", href: "/admin/kategori", label: "Kategori Jasa" },
];

export default function AdminSidebar({
  active,
  badgeCount,
}: {
  active: "verifikasi" | "mitra" | "kategori";
  badgeCount?: number;
}) {
  return (
    <aside className="w-[232px] shrink-0 bg-ink text-[#C7CCDA] p-5 flex flex-col gap-1">
      <div className="flex items-center gap-2.5 px-2.5 pb-5">
        <span className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="8" cy="8" r="3.4" stroke="white" strokeWidth="1.7" />
            <circle cx="16.5" cy="9.5" r="2.6" stroke="white" strokeWidth="1.7" />
          </svg>
        </span>
        <span className="text-white font-display font-extrabold text-sm">Trust &amp; Safety</span>
      </div>
      <div className="text-[11px] uppercase tracking-wide text-[#7B8299] px-2.5 pt-3 pb-1.5">Menu</div>
      {NAV.map((n) => (
        <Link
          key={n.key}
          href={n.href}
          className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm ${
            active === n.key ? "bg-white/10 text-white font-semibold" : ""
          }`}
        >
          {n.label}
          {n.key === "verifikasi" && typeof badgeCount === "number" && badgeCount > 0 && (
            <span className="ml-auto bg-warn text-white text-[11px] font-bold px-1.5 rounded-full">{badgeCount}</span>
          )}
        </Link>
      ))}
      <Link href="/" className="px-2.5 py-2 rounded-lg text-sm mt-2">
        Kembali ke situs
      </Link>
    </aside>
  );
}
