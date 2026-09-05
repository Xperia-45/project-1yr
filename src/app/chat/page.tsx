"use client";

import { useState, useRef, useEffect } from "react";
import { Send, BookOpen, Quote, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export default function ChatPage() {
  const [messages, setMessages] = useState<{ role: string; content: string; sources?: any[]; insufficiency?: boolean }[]>([]);
  const [input, setInput] = useState("Explain Module 2 corrosion concepts");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [subjectId, setSubjectId] = useState("1");

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, loading]);

  async function send() {
    if (!input.trim() || loading) return;
    setMessages((m) => [...m, { role: "user", content: input }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, subjectId: parseInt(subjectId), materialOnly: true }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.answer || "No response.", sources: data.sources, insufficiency: data.insufficiency }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "Failed to get response. Check that your documents are indexed.", insufficiency: true }]);
    } finally {
      setLoading(false);
      setInput("");
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight">Ask ExamNight</h1>
        <p className="mt-2 text-slate-400">Retrieval-Augmented answers from your uploads. No outside knowledge unless you allow it.</p>
        <div className="mt-4 flex gap-2">
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="rounded-xl bg-slate-900 px-3 py-2 text-sm ring-1 ring-white/10 focus:outline-none focus:ring-indigo-400">
            <option value="1">Engineering Chemistry (Demo)</option>
          </select>
          <label className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm ring-1 ring-white/10">
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-600 accent-indigo-500" /> Answer only from my material
          </label>
        </div>
      </div>

      <div ref={scrollRef} className="h-[60vh] overflow-y-auto rounded-3xl bg-gradient-to-b from-slate-900/70 to-slate-950/90 p-6 ring-1 ring-white/10 backdrop-blur-sm space-y-5">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
            <BookOpen className="h-10 w-10 mb-3 text-indigo-400/60" />
            <h3 className="text-xl font-bold text-white">Start with your material</h3>
            <p className="max-w-md mt-2">Try: "Explain Module 3." / "What formulas do I need?" / "Give me a 5-mark answer for corrosion."</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-4 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${m.role === "user" ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white" : "bg-gradient-to-br from-rose-500 to-orange-500 text-white"}`}>
              {m.role === "user" ? "Y" : "A"}
            </div>
            <div className={`rounded-2xl px-5 py-4 text-sm leading-relaxed ring-1 ${m.role === "user" ? "bg-indigo-600/10 ring-indigo-400/20 text-indigo-50 max-w-2xl" : "bg-slate-800/60 ring-white/10 text-slate-100 max-w-3xl"}`}>
              <div className="whitespace-pre-wrap">{m.content}</div>
              {m.sources && m.sources.length > 0 && (
                <div className="mt-4 border-t border-white/10 pt-3">
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-400">Sources</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {m.sources.map((s: any, idx: number) => (
                      <button key={idx} className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1 text-xs font-medium text-indigo-200 ring-1 ring-white/10 hover:bg-white/10 transition" title={s.content_preview}>
                        <Quote className="h-3 w-3" /> {s.document_filename} {s.page_number ? `P${s.page_number}` : ""}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {m.insufficiency && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-200 ring-1 ring-amber-400/20">
                  <AlertCircle className="h-4 w-4" /> Could not find enough information in your uploaded material for this question.
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-orange-500 text-white">A</div>
            <div className="rounded-2xl bg-slate-800/60 px-5 py-4 text-sm ring-1 ring-white/10 text-slate-300">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-300" /> Retrieving from your notes...
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask about your study material..." className="flex-1 rounded-2xl bg-slate-900 px-5 py-3.5 text-sm ring-1 ring-white/10 focus:outline-none focus:ring-indigo-400 transition" />
        <button onClick={send} disabled={loading} className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 font-bold text-white shadow-xl shadow-indigo-900/30 hover:scale-[1.03] transition disabled:opacity-60"><Send className="h-5 w-5" /></button>
      </div>
    </div>
  );
}
