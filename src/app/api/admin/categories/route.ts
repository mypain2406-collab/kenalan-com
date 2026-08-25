import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { store } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Akses ditolak. Hanya admin yang dapat mengelola kategori." }, { status: 403 });
  }
  const categories = await store.listCategories();
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Akses ditolak. Hanya admin yang dapat mengelola kategori." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (name.length < 2 || name.length > 60) {
    return NextResponse.json({ error: "Nama kategori harus 2-60 karakter" }, { status: 400 });
  }

  try {
    const category = await store.createCategory(name);
    return NextResponse.json({ ok: true, category });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal menambahkan kategori";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
