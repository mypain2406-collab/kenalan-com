import Link from "next/link";
import { getSession } from "@/lib/auth";

export default function Navbar() {
    const session = getSession();

  return (
        <nav className="flex items-center justify-between px-14 h-[76px] bg-surface border-b border-border">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-[9px] bg-accent flex items-center justify-center shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="8" cy="8" r="3.4" stroke="white" strokeWidth="1.7" />
                <circle cx="16.5" cy="9.5" r="2.6" stroke="white" strokeWidth="1.7" />
                <path d="M3 19c0-3 2.2-5.2 5-5.2s5 2.2 5 5.2" stroke="white" strokeWidth="1.7" strokeLinecap="round" />
                <path d="M13.2 19c0-2.4 1.6-4.1 3.3-4.1S20 16.6 20 19" stroke="white" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </span>
            <span className="font-display font-extrabold text-lg tracking-tight">Kenalan.com</span>
          </Link>
          <div className="hidden md:flex items-center gap-9 text-sm font-medium text-inksoft">
            <Link href="/cari" className="hover:text-ink">Cari Jasa</Link>
            <Link href="/daftar/mitra" className="hover:text-ink">Jadi Mitra</Link>
    {session?.role === "admin" && (
              <Link href="/admin/verifikasi" className="hover:text-ink">Dashboard Admin</Link>
            )}
      </div>
          <div className="flex items-center gap-3">
    {session ? (
              <>
                <span className="text-sm text-inksoft hidden sm:inline">Halo, {session.name.split(" ")[0]}</span>
                <form action="/api/auth/logout" method="post">
                  <button className="text-sm font-semibold px-4 py-2 rounded-lg border border-border bg-surface">Keluar</button>
                </form>
              </>
            ) : (
              <>
                <Link href="/masuk" className="text-sm font-semibold px-4 py-2 rounded-lg text-inksoft">Masuk</Link>
                <Link href="/daftar/pencari" className="text-sm font-semibold px-5 py-2.5 rounded-lg bg-accent text-white">Daftar Gratis</Link>
              </>
            )}
          </div>
        </nav>
      );
}
