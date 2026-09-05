import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { GraduationCap } from "lucide-react";

export const metadata: Metadata = {
  title: "ExamNight — AI Study Assistant",
  description: "Retrieval-Augmented Generation study assistant for college exams.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500/30">
        <header className="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-4">
            <a href="/" className="flex items-center gap-2.5 text-indigo-300 hover:text-indigo-200 transition-colors">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-900/20">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">ExamNight</span>
            </a>
            <nav className="ml-auto flex items-center gap-1 text-sm font-medium text-slate-300">
              <a href="/" className="rounded-lg px-3 py-2 hover:bg-slate-800/60 hover:text-white transition-colors">Dashboard</a>
              <a href="/?tab=subjects" className="rounded-lg px-3 py-2 hover:bg-slate-800/60 hover:text-white transition-colors">My Subjects</a>
              <a href="/chat" className="rounded-lg px-3 py-2 hover:bg-slate-800/60 hover:text-white transition-colors">Ask Night</a>
              <a href="/one-night" className="rounded-lg px-3 py-2 bg-gradient-to-r from-rose-600 to-orange-600 text-white shadow-lg shadow-rose-900/30 hover:from-rose-500 hover:to-orange-500 transition-all">🔥 One Night</a>
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
