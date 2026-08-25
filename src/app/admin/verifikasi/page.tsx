import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { store } from "@/lib/db";
import AdminSidebar from "@/components/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminVerifikasiPage() {
  const session = getSession();
  if (!session) redirect("/masuk?next=/admin/verifikasi");
  if (session.role !== "admin") redirect("/");

  const queue = await store.listPendingVerifications();
  const applicants = Object.fromEntries(
    await Promise.all(queue.map(async (v) => [v.userId, await store.getUserById(v.userId)] as const))
  );

  return (
    <div className="flex min-h-screen">
      <AdminSidebar active="verifikasi" badgeCount={queue.length} />

      <div className="flex-1">
        <div className="px-8 py-6 border-b border-border bg-surface">
          <h1 className="font-display font-bold text-xl">Antrean Verifikasi Identitas</h1>
          <p className="text-sm text-inksoft mt-1">{queue.length} pengajuan menunggu tinjauan</p>
        </div>

        <div className="p-8 flex flex-col gap-2.5 max-w-3xl">
          {queue.length === 0 && (
            <div className="card p-8 text-center text-inksoft text-sm">Tidak ada pengajuan yang menunggu tinjauan saat ini.</div>
          )}
          {queue.map((v) => {
            const applicant = applicants[v.userId];
            return (
              <Link key={v.id} href={`/admin/verifikasi/${v.id}`} className="card p-4 flex items-center gap-3.5 hover:border-accent">
                <div className="w-9 h-9 rounded-lg bg-accentsoft text-accentink flex items-center justify-center font-bold text-xs shrink-0">
                  {applicant?.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <div>
                  <div className="font-semibold text-sm">{applicant?.name}</div>
                  <div className="text-xs text-inkfaint">Pengajuan {v.jenis} · {new Date(v.createdAt).toLocaleDateString("id-ID")}</div>
                </div>
                <span className={`ml-auto text-[11px] font-bold px-2.5 py-1 rounded-full ${v.riskFlag ? "bg-dangersoft text-danger" : "bg-goodsoft text-good"}`}>
                  {v.riskFlag ? "Risiko sedang" : "Risiko rendah"}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
