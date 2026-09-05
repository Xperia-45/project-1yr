import { pgTable, serial, varchar, text, timestamp, integer, boolean, jsonb, real, pgSchema } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  course: varchar("course", { length: 255 }),
  exam_date: timestamp("exam_date", { withTimezone: true }),
  exam_type: varchar("exam_type", { length: 50 }).default("FAT"),
  syllabus: text("syllabus"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  subject_id: integer("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  filename: varchar("filename", { length: 500 }).notNull(),
  file_type: varchar("file_type", { length: 20 }).notNull(),
  file_size: integer("file_size"),
  text_content: text("text_content"),
  processing_status: varchar("processing_status", { length: 30 }).default("uploading").notNull(),
  page_count: integer("page_count"),
  chunk_count: integer("chunk_count"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const documentChunks = pgTable("document_chunks", {
  id: serial("id").primaryKey(),
  document_id: integer("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  subject_id: integer("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  embedding: real("embedding").array(), // Stored as float array; pgvector vector type preferred when extension available
  page_number: integer("page_number"),
  chunk_index: integer("chunk_index").notNull(),
  section_title: varchar("section_title", { length: 500 }),
  metadata: jsonb("metadata").default({}),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subject_id: integer("subject_id").references(() => subjects.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  session_id: integer("session_id").notNull().references(() => chatSessions.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).notNull(),
  content: text("content").notNull(),
  sources_json: jsonb("sources_json").default([]),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const studyPlans = pgTable("study_plans", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subject_id: integer("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  hours_available: integer("hours_available"),
  preparation_level: varchar("preparation_level", { length: 50 }).default("half_prepared"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const studyPlanItems = pgTable("study_plan_items", {
  id: serial("id").primaryKey(),
  plan_id: integer("plan_id").notNull().references(() => studyPlans.id, { onDelete: "cascade" }),
  module_name: varchar("module_name", { length: 500 }).notNull(),
  priority: varchar("priority", { length: 20 }).notNull(),
  estimated_minutes: integer("estimated_minutes").notNull(),
  reason: text("reason"),
  source_refs: jsonb("source_refs").default([]),
  completed: boolean("completed").default(false),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const quizSessions = pgTable("quiz_sessions", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subject_id: integer("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  mode: varchar("mode", { length: 50 }).notNull().default("quick"),
  score: integer("score").default(0),
  total: integer("total").default(0),
  completed_at: timestamp("completed_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  session_id: integer("session_id").notNull().references(() => quizSessions.id, { onDelete: "cascade" }),
  question_text: text("question_text").notNull(),
  options_json: jsonb("options_json").default([]),
  correct_answer: text("correct_answer").notNull(),
  explanation: text("explanation"),
  source_refs: jsonb("source_refs").default([]),
  user_answer: text("user_answer"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const studyProgress = pgTable("study_progress", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subject_id: integer("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  document_id: integer("document_id").references(() => documents.id, { onDelete: "cascade" }),
  minutes_studied: integer("minutes_studied").default(0),
  completed: boolean("completed").default(false),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
