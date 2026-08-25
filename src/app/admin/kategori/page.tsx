import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { store } from "@/lib/db";
import AdminSidebar from "@/components/AdminSidebar";
import CategoryManager from "@/components/CategoryManager";

export const dynamic = "force-dynamic";

export default async function AdminKategoriPage() {
  const session = getSession();
  if (!session) redirect("/masuk?next=/admin/kategori");
  if (session.role !== "admin") redirect("/");

  const [categories, queue] = await Promise.all([store.listCategories(), store.listPendingVerifications()]);

  return (
    <div className="flex min-h-screen">
      <AdminSidebar active="kategori" badgeCount={queue.length} />

      <div className="flex-1">
        <div className="px-8 py-6 border-b border-border bg-surface">
          <h1 className="font-display font-bold text-xl">Kategori Jasa</h1>
          <p className="text-sm text-inksoft mt-1">
            {categories.length} kategori aktif · muncul di beranda, pencarian, dan wizard pendaftaran mitra.
          </p>
        </div>

        <div className="p-8 max-w-xl">
          <CategoryManager initialCategories={categories} />
        </div>
      </div>
    </div>
  );
}
