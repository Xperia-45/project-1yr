import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subjects, users } from "@/db/schema";
import { sql, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    // For demo, use user id 1 if exists, else get first
    const userRes = await db.execute(sql`SELECT id FROM users LIMIT 1`);
    const userId = (userRes.rows?.[0] as any)?.id || 1;
    const data = await db.select().from(subjects).where(eq(subjects.user_id, userId)).orderBy(sql`${subjects.exam_date} ASC`);
    return NextResponse.json({ subjects: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userRes = await db.execute(sql`SELECT id FROM users LIMIT 1`);
    const userId = (userRes.rows?.[0] as any)?.id || 1;
    // Ensure user exists
    await db.execute(sql`INSERT INTO users (email, name) VALUES ('demo@examnight.ai', 'Demo Student') ON CONFLICT (email) DO NOTHING`);
    const userFetch = await db.execute(sql`SELECT id FROM users WHERE email = 'demo@examnight.ai'`);
    const uid = (userFetch.rows?.[0] as any)?.id || userId;
    const [newSubj] = await db.insert(subjects).values({
      user_id: uid,
      name: body.name || "New Subject",
      course: body.course || "",
      exam_date: body.exam_date ? new Date(body.exam_date) : null,
      exam_type: body.exam_type || "FAT",
      syllabus: body.syllabus || null,
    }).returning();
    return NextResponse.json({ subject: newSubj });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
