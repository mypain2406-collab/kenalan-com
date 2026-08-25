import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { store } from "@/lib/db";
import AdminSidebar from "@/components/AdminSidebar";
import MitraForm from "@/components/MitraForm";

export const dynamic = "force-dynamic";

export default async function AdminMitraBaruPage() {
  const session = getSession();
  if (!session) redirect("/masuk?next=/admin/mitra/baru");
  if (session.role !== "admin") redirect("/");

  const [categories, queue] = await Promise.all([store.listCategories(), store.listPendingVerifications()]);

  return (
    <div className="flex min-h-screen">
      <AdminSidebar active="mitra" badgeCount={queue.length} />

      <div className="flex-1">
        <div className="px-8 py-6 border-b border-border bg-surface">
          <h1 className="font-display font-bold text-xl">Tambah Mitra Baru</h1>
          <p className="text-sm text-inksoft mt-1">
            Buat akun &amp; profil mitra langsung dari dashboard, tanpa melalui wizard pendaftaran mandiri.
          </p>
        </div>

        <div className="p-8 max-w-xl">
          <MitraForm mode="create" categories={categories.map((c) => c.name)} />
        </div>
      </div>
    </div>
  );
}
