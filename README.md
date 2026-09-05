# project-1yr
# 🌙 ExamNight

<p align="center">
  <strong>Turn your notes into an exam-eve game plan.</strong><br />
  A material-grounded study companion built for the night before the exam.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-149ECA?style=for-the-badge&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/PostgreSQL-Database-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/RAG-Local%20Embeddings-7C3AED?style=for-the-badge" alt="Local RAG" />
</p>

<p align="center">
  <a href="#-quick-start">Quick start</a> ·
  <a href="#-how-it-works">How it works</a> ·
  <a href="#-features">Features</a> ·
  <a href="#-api-at-a-glance">API</a>
</p>

---

## ✨ Why ExamNight?

When time is short, finding what to study matters as much as studying itself. ExamNight turns course notes into one focused place to ask questions, identify priorities, build a revision plan, and test yourself—without drifting beyond your uploaded material.

> **Your notes in. Your exam plan out.**

## 🚀 Features

| 📚 | Feature | What it gives you |
| :---: | --- | --- |
| 🗂️ | **Subject dashboard** | Keep subjects, courses, and exam dates in one place. |
| 📤 | **Smart uploads** | Extract, chunk, and index notes for search-ready study material. |
| 💬 | **Grounded chat** | Ask questions and receive answers with document, page, and chunk references. |
| 🔥 | **One-night planner** | Build a time-boxed, prioritised revision plan from your syllabus and notes. |
| ⚡ | **Practice mode** | Generate quick, exam, or intensive question sessions from uploaded content. |
| 🧠 | **Local embeddings** | Uses MiniLM embeddings locally—an OpenAI API key is not needed. |

## 🧭 How it works

```text
📄 Upload notes
      ↓
✂️ Extract & split into chunks
      ↓
🧠 Create local MiniLM embeddings
      ↓
🔎 Find the most relevant excerpts
      ↓
💬 Answer with sources  •  🔥 Build a study plan  •  ⚡ Create practice questions
```

ExamNight splits text into **900-character chunks** with **150-character overlap**, then ranks the best matches for a question using cosine similarity in PostgreSQL. The answer layer is intentionally extractive, keeping responses close to your source material.

---

## 🛠️ Tech stack

- [Next.js 16](https://nextjs.org/) with React 19 and TypeScript
- PostgreSQL + [Drizzle ORM](https://orm.drizzle.team/)
- [`@xenova/transformers`](https://huggingface.co/docs/transformers.js/) for local embeddings
- `pdf-parse` for PDF text extraction
- Tailwind CSS and Lucide icons

---

## ⚡ Quick start

### Prerequisites

- Node.js 20 or newer
- PostgreSQL 14 or newer
- npm

### 1 · Install dependencies

```bash
npm install
```

### 2 · Configure PostgreSQL

Create a PostgreSQL database, then add a `.env.local` file:

```env
DATABASE_URL=postgresql://postgres:your-password@127.0.0.1:5432/examnight
```

The committed Drizzle configuration uses a local development URL. Update `drizzle.config.json` or pass your own configuration if your database differs.

### 3 · Create the schema

Generate and apply a Drizzle migration from the schema:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

Alternatively, for local development, push the schema directly:

```bash
npx drizzle-kit push
```

### 4 · Add the retrieval helper function

The retrieval query calls `cosine_similarity` for `real[]` embedding vectors. Run this once in the target database:

```sql
CREATE OR REPLACE FUNCTION cosine_similarity(a real[], b real[])
RETURNS double precision
LANGUAGE SQL
IMMUTABLE
STRICT
AS $$
  SELECT SUM(x * y)::double precision /
         NULLIF(SQRT(SUM(x * x)) * SQRT(SUM(y * y)), 0)
  FROM UNNEST(a, b) AS t(x, y);
$$;
```

### 5 · Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🎯 Typical workflow

1. Create a subject and optionally provide its syllabus and exam date.
2. Upload notes for that subject.
3. Wait for the document status to become **Ready**.
4. Open **Ask ExamNight** and select the subject to ask grounded questions.
5. Use **Build My Exam Plan** to create a prioritised plan for the remaining hours.
6. Generate a practice session to review the material.

## 🧰 Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Run the production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript checks |

## 🔌 API at a glance

| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/health` | `GET` | Checks database connectivity |
| `/api/subjects` | `GET`, `POST` | Lists or creates subjects |
| `/api/subjects/:id` | `GET`, `DELETE` | Reads or deletes a subject |
| `/api/documents/upload` | `POST` | Uploads, extracts, chunks, and indexes a document |
| `/api/documents/:id` | `DELETE` | Deletes a document |
| `/api/chat` | `POST` | Creates or continues a grounded chat session |
| `/api/chat/:sessionId` | `GET` | Fetches chat-session messages |
| `/api/one-night-plan` | `POST` | Creates an exam-eve revision plan |
| `/api/quiz` | `POST` | Creates a practice-question session |
| `/api/revision/:subjectId` | `GET` | Retrieves revision information for a subject |

## ⚠️ Current limitations

- The app currently uses a demo user (`demo@examnight.ai` / user ID `1`); authentication is not implemented.
- PDF and plain-text uploads have the most reliable extraction. DOCX and PPTX handling is currently best-effort.
- The first embedding request may download the MiniLM model, so it can take longer than subsequent requests.
- Uploaded files are processed synchronously and stored temporarily during processing; document metadata, text, chunks, and embeddings are persisted in PostgreSQL.
- Quiz prompts are generated from retrieved excerpts and are a starting point for practice, not a full assessment engine.

## 🗺️ Project structure

```text
src/
├── app/                 # Pages and API routes
├── db/                  # Drizzle connection and schema
└── lib/                 # Extraction, chunking, embeddings, retrieval, synthesis
```

## 🤝 Contributing

Contributions are welcome. Before opening a pull request, please run:

```bash
npm run lint
npm run typecheck
```

## 📄 License

No license has been specified yet. Add a license file before distributing or accepting external contributions.
