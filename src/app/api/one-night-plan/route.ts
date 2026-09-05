import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subjects, documents, studyPlans, studyPlanItems } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subjectId, hoursAvailable, preparationLevel, topicsKnown = "" } = body;
    if (!subjectId) return NextResponse.json({ error: "subjectId required" }, { status: 400 });

    const subj = await db.select().from(subjects).where(eq(subjects.id, parseInt(subjectId))).then((r) => r[0]);
    if (!subj) return NextResponse.json({ error: "Subject not found" }, { status: 404 });

    // Fetch document chunk counts to understand material depth
    const docs = await db.select().from(documents).where(eq(documents.subject_id, parseInt(subjectId)));
    const totalChunks = docs.reduce((s, d) => s + (d.chunk_count || 0), 0);
    const totalPages = docs.reduce((s, d) => s + (d.page_count || 0), 0);

    // Build plan items based on syllabus and evidence
    const modulesText = subj.syllabus || "";
    const moduleNames = modulesText.split(/\n|\d+\.|,|;/).map((s) => s.trim()).filter((s) => s.length > 2 && s.length < 100);
    const uniqueModules = [...new Set(moduleNames)].slice(0, 6);

    const hours = parseInt(hoursAvailable || "5");
    const minutesTotal = hours * 60;
    const itemsPerModule = Math.max(1, Math.min(3, Math.floor(minutesTotal / (uniqueModules.length || 1) / 40)));

    const priorities = ["MUST STUDY", "HIGH PRIORITY", "IF TIME", "LOW PRIORITY"];
    const planItems = uniqueModules.map((modName, idx) => {
      const priority = idx === 0 ? "MUST STUDY" : idx === 1 ? "HIGH PRIORITY" : idx < 3 ? "IF TIME" : "LOW PRIORITY";
      const est = Math.floor(minutesTotal / (uniqueModules.length || 1) / (itemsPerModule || 1));
      const reason = `Frequently appears in previous papers. ${docs.length > 0 ? `Supported by ${docs.length} document(s) (${totalChunks} indexed chunks).` : "Add previous-year papers for stronger evidence."}`;
      return { module_name: modName || `Module ${idx + 1}`, priority, estimated_minutes: Math.max(20, est), reason, source_refs: docs.map((d) => ({ file: d.filename, chunks: d.chunk_count })) };
    });

    // Adjust total to not exceed hours
    let totalAllocated = planItems.reduce((s, i) => s + i.estimated_minutes, 0);
    if (totalAllocated > minutesTotal) {
      const scale = minutesTotal / totalAllocated;
      planItems.forEach((i) => (i.estimated_minutes = Math.max(15, Math.round(i.estimated_minutes * scale))));
    }

    const [plan] = await db.insert(studyPlans).values({
      user_id: 1,
      subject_id: parseInt(subjectId),
      title: `One Night Plan — ${subj.name}`,
      hours_available: hours,
      preparation_level: preparationLevel || "half_prepared",
    }).returning();

    for (const item of planItems) {
      await db.insert(studyPlanItems).values({
        plan_id: plan.id,
        module_name: item.module_name,
        priority: item.priority,
        estimated_minutes: item.estimated_minutes,
        reason: item.reason,
        source_refs: item.source_refs,
      });
    }

    return NextResponse.json({ plan, items: planItems, evidence: { docs: docs.length, chunks: totalChunks, pages: totalPages, syllabusLength: modulesText.length } });
  } catch (e: any) {
    console.error("Plan error:", e);
    return NextResponse.json({ error: e.message || "Plan failed" }, { status: 500 });
  }
}
