import { type User, type InsertUser, type Report, type InsertReport, type InsertReportMessage, type ReportMessage, type InsertSystemLog, type SystemLog, type InsertMemo, type Memo, users, reports, reportMessages, systemLogs, memos } from "@shared/schema";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq, desc, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createReport(report: InsertReport): Promise<Report>;
  getReport(id: string): Promise<(Report & { submitterName: string | null }) | undefined>;
  updateReport(id: string, updates: Partial<Report>): Promise<(Report & { submitterName: string | null }) | undefined>;
  getReports(): Promise<(Report & { submitterName: string | null })[]>;
  getReportsBySubmitter(userId: string): Promise<(Report & { submitterName: string | null })[]>;
  createReportMessage(message: InsertReportMessage): Promise<ReportMessage>;
  getReportMessages(reportId: string): Promise<(ReportMessage & { senderName: string | null })[]>;
  createSystemLog(log: InsertSystemLog): Promise<SystemLog>;
  getSystemLogs(filters?: { role?: string; module?: string; userId?: string; search?: string; limit?: number }): Promise<SystemLog[]>;
  createMemo(memo: InsertMemo): Promise<Memo>;
  getMemos(filters?: { status?: string; category?: string; showOnlyApproved?: boolean }): Promise<(Memo & { issuerName: string | null })[]>;
  updateMemo(id: string, updates: Partial<Memo>): Promise<(Memo & { issuerName: string | null }) | undefined>;
}

let dbInstance: ReturnType<typeof drizzle> | null = null;

async function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "barangay_report",
    port: parseInt(process.env.DB_PORT || "3306"),
  });

  dbInstance = drizzle(connection);
  return dbInstance;
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const db = await getDb();
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const db = await getDb();
    const result = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const db = await getDb();
    const result = await db.insert(users).values(insertUser);
    const createdUser = await this.getUserByUsername(insertUser.username);
    if (!createdUser) {
      throw new Error("Failed to create user");
    }
    return createdUser;
  }

  async createReport(report: InsertReport): Promise<Report> {
    const db = await getDb();
    try {
      // Generate UUID on application side so we can retrieve the record
      const reportId = randomUUID();

      // Insert the report with the generated ID
      // Type assertion needed because id is not part of InsertReport type
      await db.insert(reports).values({
        ...report,
        id: reportId,
      } as any);

      // Retrieve the created report by ID
      const created = await db
        .select()
        .from(reports)
        .where(eq(reports.id, reportId))
        .limit(1);

      if (!created || !created[0]) {
        throw new Error("Failed to retrieve created report from database");
      }

      return created[0];
    } catch (error) {
      console.error("Error in createReport:", error);
      // Re-throw with more context if it's a database error
      if (error instanceof Error) {
        throw new Error(`Failed to create report: ${error.message}`);
      }
      throw error;
    }
  }

  async getReport(id: string): Promise<(Report & { submitterName: string | null }) | undefined> {
    const db = await getDb();
    const result = await db
      .select({
        id: reports.id,
        category: reports.category,
        description: reports.description,
        priority: reports.priority,
        location: reports.location,
        status: reports.status,
        images: reports.images,
        additionalInfo: reports.additionalInfo,
        additionalInfoImages: reports.additionalInfoImages,
        adminFeedback: reports.adminFeedback,
        submittedBy: reports.submittedBy,
        submittedAt: reports.submittedAt,
        updatedAt: reports.updatedAt,
        submitterName: users.username,
      })
      .from(reports)
      .leftJoin(users, eq(reports.submittedBy, users.id))
      .where(eq(reports.id, id))
      .limit(1);
    return result[0];
  }

  async updateReport(id: string, updates: Partial<Report>): Promise<(Report & { submitterName: string | null }) | undefined> {
    const db = await getDb();
    try {
      await db
        .update(reports)
        .set({
          ...updates,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(reports.id, id));

      // Return the updated report with submitter name
      return await this.getReport(id);
    } catch (error) {
      console.error("Error updating report:", error);
      throw error;
    }
  }

  async getReports(): Promise<(Report & { submitterName: string | null })[]> {
    const db = await getDb();
    const result = await db
      .select({
        id: reports.id,
        category: reports.category,
        description: reports.description,
        priority: reports.priority,
        location: reports.location,
        status: reports.status,
        images: reports.images,
        additionalInfo: reports.additionalInfo,
        additionalInfoImages: reports.additionalInfoImages,
        adminFeedback: reports.adminFeedback,

        submittedBy: reports.submittedBy,
        submittedAt: reports.submittedAt,
        updatedAt: reports.updatedAt,
        submitterName: users.username,
      })
      .from(reports)
      .leftJoin(users, eq(reports.submittedBy, users.id))
      .orderBy(desc(reports.submittedAt));
    return result;
  }

  async getReportsBySubmitter(userId: string): Promise<(Report & { submitterName: string | null })[]> {
    const db = await getDb();
    const result = await db
      .select({
        id: reports.id,
        category: reports.category,
        description: reports.description,
        priority: reports.priority,
        location: reports.location,
        status: reports.status,
        images: reports.images,
        additionalInfo: reports.additionalInfo,
        additionalInfoImages: reports.additionalInfoImages,
        adminFeedback: reports.adminFeedback,
        submittedBy: reports.submittedBy,
        submittedAt: reports.submittedAt,
        updatedAt: reports.updatedAt,
        submitterName: users.username,
      })
      .from(reports)
      .leftJoin(users, eq(reports.submittedBy, users.id))
      .where(eq(reports.submittedBy, userId))
      .orderBy(desc(reports.submittedAt));
    return result;
  }

  async createReportMessage(message: InsertReportMessage): Promise<ReportMessage> {
    const db = await getDb();
    try {
      const messageId = randomUUID();
      await db.insert(reportMessages).values({
        ...message,
        id: messageId,
      } as any);

      const created = await db
        .select()
        .from(reportMessages)
        .where(eq(reportMessages.id, messageId))
        .limit(1);

      if (!created || !created[0]) {
        throw new Error("Failed to retrieve created message from database");
      }

      return created[0];
    } catch (error) {
      console.error("Error in createReportMessage:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to create message: ${error.message}`);
      }
      throw error;
    }
  }

  async getReportMessages(reportId: string): Promise<(ReportMessage & { senderName: string | null })[]> {
    const db = await getDb();
    const result = await db
      .select({
        id: reportMessages.id,
        reportId: reportMessages.reportId,
        senderId: reportMessages.senderId,
        senderRole: reportMessages.senderRole,
        message: reportMessages.message,
        images: reportMessages.images,
        createdAt: reportMessages.createdAt,
        senderName: users.username,
      })
      .from(reportMessages)
      .leftJoin(users, eq(reportMessages.senderId, users.id))
      .where(eq(reportMessages.reportId, reportId))
      .orderBy(reportMessages.createdAt);
    return result;
  }

  async createSystemLog(log: InsertSystemLog): Promise<SystemLog> {
    const db = await getDb();
    try {
      const logId = randomUUID();
      await db.insert(systemLogs).values({
        ...log,
        id: logId,
      } as any);

      const created = await db
        .select()
        .from(systemLogs)
        .where(eq(systemLogs.id, logId))
        .limit(1);

      if (!created || !created[0]) {
        throw new Error("Failed to retrieve created log from database");
      }

      return created[0];
    } catch (error) {
      console.error("Error in createSystemLog:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to create log: ${error.message}`);
      }
      throw error;
    }
  }

  async getSystemLogs(filters?: { role?: string; module?: string; userId?: string; search?: string; limit?: number }): Promise<SystemLog[]> {
    const db = await getDb();
    let query = db.select().from(systemLogs);

    const conditions = [];
    if (filters?.role) {
      conditions.push(eq(systemLogs.userRole, filters.role));
    }
    if (filters?.module) {
      conditions.push(eq(systemLogs.module, filters.module));
    }
    if (filters?.userId) {
      conditions.push(eq(systemLogs.userId, filters.userId));
    }
    if (filters?.search) {
      const searchPattern = `%${filters.search}%`;
      conditions.push(
        sql`(${systemLogs.action} LIKE ${searchPattern} OR ${systemLogs.affectedData} LIKE ${searchPattern} OR ${systemLogs.userName} LIKE ${searchPattern})`
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    query = query.orderBy(desc(systemLogs.timestamp)) as any;
    
    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }

    const result = await query;
    return result;
  }

  async createMemo(memo: InsertMemo): Promise<Memo> {
    const db = await getDb();
    try {
      const memoId = randomUUID();
      await db.insert(memos).values({
        ...memo,
        id: memoId,
      } as any);

      const created = await db
        .select()
        .from(memos)
        .where(eq(memos.id, memoId))
        .limit(1);

      if (!created || !created[0]) {
        throw new Error("Failed to retrieve created memo from database");
      }

      return created[0];
    } catch (error) {
      console.error("Error in createMemo:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to create memo: ${error.message}`);
      }
      throw error;
    }
  }

  async getMemos(filters?: { status?: string; category?: string; showOnlyApproved?: boolean }): Promise<(Memo & { issuerName: string | null })[]> {
    const db = await getDb();
    const conditions = [];
    
    if (filters?.showOnlyApproved) {
      conditions.push(eq(memos.status, "approved"));
    } else if (filters?.status && filters.status !== "all") {
      conditions.push(eq(memos.status, filters.status));
    }
    if (filters?.category && filters.category !== "all") {
      conditions.push(eq(memos.category, filters.category));
    }

    let query = db
      .select({
        id: memos.id,
        title: memos.title,
        description: memos.description,
        category: memos.category,
        status: memos.status,
        effectiveDate: memos.effectiveDate,
        fileUrl: memos.fileUrl,
        issuedBy: memos.issuedBy,
        createdAt: memos.createdAt,
        updatedAt: memos.updatedAt,
        issuerName: users.username,
      })
      .from(memos)
      .leftJoin(users, eq(memos.issuedBy, users.id));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    query = query.orderBy(desc(memos.createdAt)) as any;
    const result = await query;
    return result;
  }

  async updateMemo(id: string, updates: Partial<Memo>): Promise<(Memo & { issuerName: string | null }) | undefined> {
    const db = await getDb();
    try {
      await db
        .update(memos)
        .set({
          ...updates,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(memos.id, id));

      const result = await db
        .select({
          id: memos.id,
          title: memos.title,
          description: memos.description,
          category: memos.category,
          status: memos.status,
          effectiveDate: memos.effectiveDate,
          fileUrl: memos.fileUrl,
          issuedBy: memos.issuedBy,
          createdAt: memos.createdAt,
          updatedAt: memos.updatedAt,
          issuerName: users.username,
        })
        .from(memos)
        .leftJoin(users, eq(memos.issuedBy, users.id))
        .where(eq(memos.id, id))
        .limit(1);

      return result[0];
    } catch (error) {
      console.error("Error updating memo:", error);
      throw error;
    }
  }
}

export const storage = new DbStorage();
