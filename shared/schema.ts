import { sql } from "drizzle-orm";
import { mysqlTable, text, varchar, datetime, json } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const reports = mysqlTable("reports", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  category: text("category").notNull(),
  description: text("description").notNull(),
  priority: varchar("priority", { length: 20 }).notNull(),
  location: text("location").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("submitted"),
  images: json("images").$type<string[]>().default(sql`JSON_ARRAY()`),
  additionalInfo: text("additional_info"),
  additionalInfoImages: json("additional_info_images").$type<string[]>().default(sql`JSON_ARRAY()`),
  adminFeedback: text("admin_feedback"),
  submittedBy: varchar("submitted_by", { length: 36 }).notNull(),
  submittedAt: datetime("submitted_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const reportMessages = mysqlTable("report_messages", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  reportId: varchar("report_id", { length: 36 }).notNull(),
  senderId: varchar("sender_id", { length: 36 }).notNull(),
  senderRole: varchar("sender_role", { length: 20 }).notNull(),
  message: text("message").notNull(),
  images: json("images").$type<string[]>().default(sql`JSON_ARRAY()`),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const systemLogs = mysqlTable("system_logs", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  userId: varchar("user_id", { length: 36 }),
  userName: text("user_name"),
  userRole: varchar("user_role", { length: 20 }),
  action: text("action").notNull(),
  affectedData: text("affected_data"),
  module: varchar("module", { length: 50 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  metadata: json("metadata").$type<Record<string, any>>(),
  timestamp: datetime("timestamp").default(sql`CURRENT_TIMESTAMP`),
});

export const memos = mysqlTable("memos", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  effectiveDate: datetime("effective_date"),
  fileUrl: text("file_url"),
  issuedBy: varchar("issued_by", { length: 36 }).notNull(),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertReportSchema = createInsertSchema(reports).pick({
  category: true,
  description: true,
  priority: true,
  location: true,
  images: true,
  submittedBy: true,
});

export const insertReportMessageSchema = createInsertSchema(reportMessages).pick({
  reportId: true,
  senderId: true,
  senderRole: true,
  message: true,
  images: true,
});

export const insertSystemLogSchema = createInsertSchema(systemLogs).pick({
  userId: true,
  userName: true,
  userRole: true,
  action: true,
  affectedData: true,
  module: true,
  ipAddress: true,
  userAgent: true,
  metadata: true,
});

export const insertMemoSchema = createInsertSchema(memos).pick({
  title: true,
  description: true,
  category: true,
  effectiveDate: true,
  fileUrl: true,
  issuedBy: true,
  status: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertReportMessage = z.infer<typeof insertReportMessageSchema>;
export type ReportMessage = typeof reportMessages.$inferSelect;
export type InsertSystemLog = z.infer<typeof insertSystemLogSchema>;
export type SystemLog = typeof systemLogs.$inferSelect;
export type InsertMemo = z.infer<typeof insertMemoSchema>;
export type Memo = typeof memos.$inferSelect;