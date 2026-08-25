import { NextResponse } from "next/server";
import { store } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Endpoint publik: dipakai wizard pendaftaran mitra (Client Component) untuk
 * memuat daftar kategori jasa yang bisa dikelola admin dari dashboard. */
export async function GET() {
  const categories = await store.listCategories();
  return NextResponse.json({ categories: categories.map((c) => c.name) });
}
