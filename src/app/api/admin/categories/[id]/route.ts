import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { store } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Akses ditolak. Hanya admin yang dapat mengelola kategori." }, { status: 403 });
  }
  await store.deleteCategory(params.id);
  return NextResponse.json({ ok: true });
}
