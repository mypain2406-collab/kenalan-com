import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { store } from "@/lib/db";
import AdminSidebar from "@/components/AdminSidebar";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  aktif: "Aktif",
  menunggu: "Menunggu",
  ditangguhkan: "Ditangguhkan",
  ditolak: "Ditolak",
};

const STATUS_CLASS: Record<string, string> = {
  aktif: "bg-goodsoft text-good",
  menunggu: "bg-surface2 text-inksoft",
  ditangguhkan: "bg-dangersoft text-danger",
  ditolak: "bg-dangersoft text-danger",
};

export default async function AdminMitraPage() {
  const session = getSession();
  if (!session) redirect("/masuk?next=/admin/mitra");
  if (session.role !== "admin") redirect("/");

  const [profiles, queue] = await Promise.all([store.adminListProfiles(), store.listPendingVerifications()]);
  const users = Object.fromEntries(
    await Promise.all(profiles.map(async (p) => [p.userId, await store.getUserById(p.userId)] as const))
  );

  return (
    <div className="flex min-h-screen">
      <AdminSidebar active="mitra" badgeCount={queue.length} />

      <div className="flex-1">
        <div className="px-8 py-6 border-b border-border bg-surface flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-xl">Data Mitra</h1>
            <p className="text-sm text-inksoft mt-1">{profiles.length} profil mitra terdaftar</p>
          </div>
          <Link href="/admin/mitra/baru" className="bg-accent text-white font-semibold text-sm px-5 py-2.5 rounded-lg shrink-0">
            + Tambah Mitra
          </Link>
        </div>

        <div className="p-8 flex flex-col gap-2.5 max-w-4xl">
          {profiles.length === 0 && (
            <div className="card p-8 text-center text-inksoft text-sm">Belum ada profil mitra.</div>
          )}
          {profiles.map((p) => {
            const user = users[p.userId];
            return (
              <Link key={p.id} href={`/admin/mitra/${p.id}`} className="card p-4 flex items-center gap-3.5 hover:border-accent">
                <div className="w-9 h-9 rounded-lg bg-accentsoft text-accentink flex items-center justify-center font-bold text-xs shrink-0">
                  {user?.name.split(" ").map((n) => n[0]).slice(0, 2).join("") ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{user?.name ?? "(pengguna tidak ditemukan)"}</div>
                  <div className="text-xs text-inkfaint">
                    {p.category} · {p.city}
                  </div>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${STATUS_CLASS[p.status] ?? "bg-surface2 text-inksoft"}`}>
                  {STATUS_LABEL[p.status] ?? p.status}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
