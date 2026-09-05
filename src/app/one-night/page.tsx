"use client";

import { useState } from "react";
import { Clock, Flame, Star, CheckCircle2, AlertCircle } from "lucide-react";

export default function OneNightPage() {
  const [subjectId, setSubjectId] = useState("1");
  const [hours, setHours] = useState("5");
  const [prep, setPrep] = useState("half_prepared");
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/one-night-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId: parseInt(subjectId), hoursAvailable: hours, preparationLevel: prep, topicsKnown: "" }),
      });
      const data = await res.json();
      setPlan(data);
    } catch (e) { alert("Failed to generate plan"); }
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-10 rounded-3xl bg-gradient-to-br from-rose-950 via-slate-900 to-orange-950 p-10 ring-1 ring-white/10 shadow-2xl shadow-rose-950/30">
        <div className="flex items-center gap-3 text-rose-300 font-bold uppercase tracking-wide text-xs"><Flame className="h-4 w-4" /> Signature Feature</div>
        <h1 className="mt-3 text-5xl font-extrabold leading-tight tracking-tight text-white">One Night Mode</h1>
        <p className="mt-3 text-lg text-rose-200/80 max-w-xl">You have one night, limited time, and a syllabus to conquer. We analyze your notes, previous papers, and remaining hours to build an exam survival plan.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 rounded-3xl bg-slate-900/60 p-7 ring-1 ring-white/10">
          <h2 className="text-xl font-extrabold mb-5">Build Your Plan</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-xs font-bold uppercase text-slate-400">Subject</label>
              <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="mt-2 w-full rounded-xl bg-slate-950 px-3 py-2.5 text-sm ring-1 ring-white/10 focus:outline-none focus:ring-indigo-400">
                <option value="1">Engineering Chemistry</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-slate-400">Hours Available</label>
              <input type="number" value={hours} onChange={(e) => setHours(e.target.value)} className="mt-2 w-full rounded-xl bg-slate-950 px-3 py-2.5 text-sm ring-1 ring-white/10 focus:outline-none focus:ring-indigo-400" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-slate-400">Preparation Level</label>
              <select value={prep} onChange={(e) => setPrep(e.target.value)} className="mt-2 w-full rounded-xl bg-slate-950 px-3 py-2.5 text-sm ring-1 ring-white/10 focus:outline-none focus:ring-indigo-400">
                <option value="haven't_started">Haven't started</option>
                <option value="know_basics">Know basics</option>
                <option value="half_prepared">Half prepared</option>
                <option value="mostly_prepared">Mostly prepared</option>
              </select>
            </div>
          </div>
          <button onClick={generate} disabled={loading} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-600 to-orange-600 px-6 py-3 font-extrabold text-white shadow-xl shadow-rose-900/30 hover:scale-[1.03] transition disabled:opacity-60">
            <Flame className="h-5 w-5" /> {loading ? "Analyzing..." : "Generate Study Plan"}
          </button>
        </div>

        <div className="rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 p-7 ring-1 ring-white/10">
          <h3 className="text-lg font-extrabold mb-3">How it works</h3>
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex gap-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" /> Reads your syllabus & uploaded notes.</li>
            <li className="flex gap-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" /> Checks previous-year papers if uploaded.</li>
            <li className="flex gap-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" /> Assigns priorities based on evidence.</li>
            <li className="flex gap-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" /> Fits total time within your hours.</li>
          </ul>
        </div>
      </div>

      {plan && (
        <section className="mt-10">
          <h2 className="text-2xl font-extrabold mb-4">Your {plan.plan?.hours_available || 5}-Hour Plan — {plan.items?.length || 0} priorities</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {plan.items?.map((item: any, idx: number) => (
              <div key={idx} className="rounded-3xl bg-slate-900/60 p-6 ring-1 ring-white/10 hover:ring-indigo-400/20 transition">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-extrabold">{item.module_name}</h3>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${item.priority === "MUST STUDY" ? "bg-rose-500/10 text-rose-300 ring-1 ring-rose-400/20" : item.priority === "HIGH PRIORITY" ? "bg-amber-500/10 text-amber-300 ring-1 ring-amber-400/20" : "bg-slate-700/30 text-slate-300 ring-1 ring-white/10"}`}>{item.priority}</span>
                </div>
                <div className="mt-3 flex items-center gap-3 text-sm text-slate-300"><Clock className="h-4 w-4 text-indigo-300" /> {item.estimated_minutes} min estimated</div>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{item.reason}</p>
                {item.source_refs && item.source_refs.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.source_refs.map((ref: any, i: number) => (
                      <span key={i} className="rounded-lg bg-white/5 px-2 py-0.5 text-xs font-medium text-slate-300 ring-1 ring-white/5">{ref.file} ({ref.chunks} chunks)</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          {plan.evidence && (
            <div className="mt-6 rounded-2xl bg-indigo-900/20 p-4 text-sm text-indigo-100 ring-1 ring-indigo-400/20 flex items-center gap-3">
              <Star className="h-4 w-4 text-indigo-300" /> Evidence: {plan.evidence.docs} docs, {plan.evidence.chunks} indexed chunks, {plan.evidence.pages} pages, syllabus length {plan.evidence.syllabusLength} chars. Priorities based on materials, not guesses.
            </div>
          )}
        </section>
      )}
    </div>
  );
}
