import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subjects } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const [subj] = await db.select().from(subjects).where(eq(subjects.id, parseInt(id)));
    if (!subj) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ subject: subj });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await db.delete(subjects).where(eq(subjects.id, parseInt(id)));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
