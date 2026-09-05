import { db } from "@/db";
import { subjects, documents } from "@/db/schema";
import { sql, eq } from "drizzle-orm";
import { Clock, BookOpen, Upload, Zap, Flame, BrainCircuit, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

async function getData() {
  const userRes = await db.execute(sql`SELECT id FROM users LIMIT 1`);
  const userId = (userRes.rows?.[0] as any)?.id || 1;
  const subs = await db.select().from(subjects).where(eq(subjects.user_id, userId)).orderBy(sql`${subjects.exam_date} ASC`).limit(6);
  const docs = await db.select().from(documents).where(eq(documents.user_id, userId));
  return { userId, subjects: subs, documents: docs };
}

export default async function DashboardPage() {
  const { userId, subjects, documents } = await getData();
  const nearestExam = subjects.find((s) => s.exam_date && new Date(s.exam_date) > new Date()) || subjects[0];
  const hoursUntil = nearestExam && nearestExam.exam_date ? Math.round((new Date(nearestExam.exam_date).getTime() - Date.now()) / (1000 * 60 * 60)) : 0;
  const docCount = documents.filter((d) => d.processing_status === "ready").length;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* Hero / Next Exam */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-violet-950 p-10 shadow-2xl shadow-indigo-950/40 ring-1 ring-white/10">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-200 backdrop-blur-md ring-1 ring-white/10">
              <Flame className="h-3.5 w-3.5" /> Your next exam
            </div>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-6xl">
              {nearestExam ? nearestExam.name : "No exam set"}
            </h1>
            <p className="mt-2 text-lg text-indigo-200/80">{nearestExam?.course || "Add a subject"} • {nearestExam?.exam_type || "Exam"}</p>
            <div className="mt-6 flex items-center gap-6 text-sm text-indigo-100/90">
              <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> {nearestExam?.exam_date ? new Date(nearestExam.exam_date).toLocaleDateString() : "Not set"}</span>
              <span className="flex items-center gap-2"><Zap className="h-4 w-4" /> {hoursUntil > 0 ? `${hoursUntil} hours left` : "Overdue / Soon"}</span>
            </div>
          </div>
          <a href="/one-night" className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-600 to-orange-600 px-7 py-4 text-base font-bold text-white shadow-xl shadow-rose-900/30 transition hover:scale-[1.03] hover:shadow-rose-900/50">
            <Flame className="h-5 w-5" /> Build My Exam Plan
          </a>
        </div>
      </section>

      {/* Quick actions */}
      <section className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-5">
        {[
          { label: "Ask ExamNight", href: "/chat", icon: BrainCircuit, desc: "RAG chat" },
          { label: "Upload Notes", href: "/?tab=documents", icon: Upload, desc: "PDF / PPT" },
          { label: "Generate Revision", href: "/revision/1", icon: BookOpen, desc: "Smart notes" },
          { label: "Practice Questions", href: "/quiz", icon: Zap, desc: "Quiz mode" },
          { label: "Previous Year", href: "/previous-papers/1", icon: CheckCircle2, desc: "Analyze papers" },
        ].map((a) => (
          <a key={a.label} href={a.href} className="group flex flex-col gap-3 rounded-2xl bg-slate-900/60 p-5 ring-1 ring-white/10 transition hover:bg-slate-800/80 hover:ring-indigo-400/30 hover:-translate-y-0.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-indigo-300 ring-1 ring-indigo-400/20 group-hover:from-indigo-500/30 group-hover:to-violet-500/30">
              <a.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-white">{a.label}</div>
              <div className="text-xs text-slate-400">{a.desc}</div>
            </div>
          </a>
        ))}
      </section>

      {/* Subjects */}
      <section className="mt-14">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold tracking-tight">My Subjects</h2>
          <a href="/?tab=subjects" className="text-sm font-medium text-indigo-300 hover:text-indigo-200">View all <ChevronRight className="inline h-3 w-3" /></a>
        </div>
        {subjects.length === 0 ? (
          <div className="rounded-3xl bg-slate-900/40 p-10 text-center ring-1 ring-white/5">
            <BookOpen className="mx-auto h-12 w-12 text-slate-500" />
            <h3 className="mt-4 text-xl font-bold">No subjects yet</h3>
            <p className="mt-2 text-slate-400">Create your first subject to start uploading notes and building a study plan.</p>
            <form action="/api/subjects" method="POST" className="mt-6 inline-flex items-center gap-3">
              <input name="name" defaultValue="Engineering Chemistry" placeholder="Subject name" className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm ring-1 ring-white/10 focus:outline-none focus:ring-indigo-400" />
              <button type="submit" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-900/30 hover:bg-indigo-500 transition">Create</button>
            </form>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {subjects.map((s) => {
              const docsForSub = documents.filter((d) => d.subject_id === s.id);
              const ready = docsForSub.filter((d) => d.processing_status === "ready").length;
              const progress = docsForSub.length ? Math.round((ready / docsForSub.length) * 100) : 0;
              return (
                <a key={s.id} href={`/chat?subject=${s.id}`} className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 p-7 ring-1 ring-white/10 transition hover:scale-[1.01] hover:ring-indigo-400/30">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-extrabold text-white">{s.name}</h3>
                      <p className="mt-1 text-sm text-slate-400">{s.course || "Course"} • {s.exam_type || "Exam"}</p>
                    </div>
                    <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-bold text-indigo-300 ring-1 ring-indigo-400/20">{s.exam_date ? new Date(s.exam_date).toLocaleDateString() : "No date"}</span>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                    <div className="rounded-xl bg-white/5 p-2.5 text-center ring-1 ring-white/5"><div className="text-lg font-extrabold text-white">{docsForSub.length}</div><div className="text-xs text-slate-400">Docs</div></div>
                    <div className="rounded-xl bg-white/5 p-2.5 text-center ring-1 ring-white/5"><div className="text-lg font-extrabold text-white">{ready}</div><div className="text-xs text-slate-400">Ready</div></div>
                    <div className="rounded-xl bg-white/5 p-2.5 text-center ring-1 ring-white/5"><div className="text-lg font-extrabold text-white">{Math.round(progress)}%</div><div className="text-xs text-slate-400">Indexed</div></div>
                  </div>
                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-400" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm font-medium text-indigo-300">Study now <ChevronRight className="h-4 w-4" /></div>
                </a>
              );
            })}
          </div>
        )}
      </section>

      {/* Documents / Indexing status */}
      <section className="mt-14">
        <h2 className="mb-6 text-2xl font-extrabold tracking-tight">Documents</h2>
        <div className="rounded-3xl bg-slate-900/50 p-7 ring-1 ring-white/10">
          {documents.length === 0 ? (
            <div className="text-center text-slate-400">No documents uploaded yet.</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase text-slate-400">
                <tr><th className="px-3 py-2">File</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Chunks</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {documents.map((d) => (
                  <tr key={d.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-3 py-2 font-medium">{d.filename}</td>
                    <td className="px-3 py-2 text-slate-400">{d.file_type}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-bold ${d.processing_status === "ready" ? "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/20" : d.processing_status === "failed" ? "bg-rose-500/10 text-rose-300 ring-1 ring-rose-400/20" : "bg-amber-500/10 text-amber-300 ring-1 ring-amber-400/20"}`}>
                        {d.processing_status === "ready" ? "Ready" : d.processing_status === "failed" ? "Failed" : d.processing_status}
                      </span>
                    </td>
                    <td className="px-3 py-2">{d.chunk_count ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <footer className="mt-20 border-t border-white/10 py-8 text-center text-sm text-slate-500">
        ExamNight — Retrieval-Augmented Generation for college exams. All answers come from your uploaded material.
      </footer>
    </div>
  );
}
