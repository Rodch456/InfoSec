import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { logAction } from "./logger";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    try {
      const user = await storage.getUserByUsername(username);
      if (!user) {
        await logAction(req, {
          action: "Failed login attempt",
          affectedData: `Username: ${username}`,
          module: "Authentication",
          metadata: { reason: "User not found" },
        });
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Verify password
      if (user.password !== password) {
        await logAction(req, {
          userId: user.id,
          userName: user.username,
          action: "Failed login attempt",
          affectedData: `Username: ${username}`,
          module: "Authentication",
          metadata: { reason: "Invalid password" },
        });
        return res.status(401).json({ error: "Invalid credentials" });
      }

      req.session.userId = user.id;

      // Log successful login
      await logAction(req, {
        userId: user.id,
        userName: user.username,
        action: "User logged in",
        affectedData: `Username: ${username}`,
        module: "Authentication",
      });

      return res.json({ user: { id: user.id, username: user.username } });
    } catch (error) {
      return res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    const userId = req.session?.userId;
    let userName: string | undefined;

    if (userId) {
      const user = await storage.getUser(userId);
      userName = user?.username;
    }

    req.session.destroy(async (err: any) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }

      if (userId) {
        await logAction(req, {
          userId,
          userName,
          action: "User logged out",
          module: "Authentication",
        });
      }

      res.clearCookie("connect.sid");
      return res.json({ success: true });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    return res.json({ userId: req.session.userId });
  });

  // Reports routes
  app.post("/api/reports", async (req, res) => {
    const { category, description, priority, location, images } = req.body;

    if (!category || !description || !priority || !location) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!req.session?.userId) {
      console.error("Report submission failed: No session userId");
      return res.status(401).json({ error: "Not authenticated" });
    }

    console.log("Creating report with userId:", req.session.userId);

    try {
      const report = await storage.createReport({
        category,
        description,
        priority,
        location,
        images: images || [],
        submittedBy: req.session.userId,
      });

      const user = await storage.getUser(req.session.userId);

      await logAction(req, {
        userId: req.session.userId,
        userName: user?.username,
        userRole: "resident", // Could be retrieved from user if role was stored
        action: "Submitted report",
        affectedData: `Report ID: ${report.id}, Category: ${category}, Priority: ${priority}`,
        module: "Reports",
        metadata: { reportId: report.id, category, priority, location },
      });

      return res.status(201).json(report);
    } catch (error) {
      console.error("Error creating report:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create report";
      return res.status(500).json({ error: errorMessage });
    }
  });

  app.get("/api/reports", async (req, res) => {
    try {
      const reports = await storage.getReports();
      return res.json(reports);
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  app.get("/api/reports/:id", async (req, res) => {
    try {
      const report = await storage.getReport(req.params.id);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      return res.json(report);
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch report" });
    }
  });

  app.patch("/api/reports/:id", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const updates = req.body;
    const reportId = req.params.id;
    const userId = req.session.userId;

    // Validate status if it's being updated
    if (updates.status) {
      const validStatuses = ['submitted', 'reviewed', 'in_progress', 'validation', 'resolved'];
      if (!validStatuses.includes(updates.status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
    }

    try {
      const user = await storage.getUser(userId);
      const existingReport = await storage.getReport(reportId);
      let logActionName = "Updated report";
      let logDetails = `Report ID: ${reportId}`;

      // If adminFeedback is being updated (admin asking for info), save as message
      if (updates.adminFeedback && updates.senderRole) {
        await storage.createReportMessage({
          reportId,
          senderId: userId,
          senderRole: updates.senderRole,
          message: updates.adminFeedback,
          images: [],
        });
        logActionName = "Requested additional information";
        logDetails = `Report ID: ${reportId} - Requested additional info from resident`;
      }

      // If additionalInfo is being updated (resident responding), save as message
      if (updates.additionalInfo && updates.senderRole) {
        await storage.createReportMessage({
          reportId,
          senderId: userId,
          senderRole: updates.senderRole,
          message: updates.additionalInfo,
          images: updates.additionalInfoImages || [],
        });
        logActionName = "Provided additional information";
        logDetails = `Report ID: ${reportId} - Responded to admin inquiry`;
      }

      // If status is being updated
      if (updates.status && existingReport) {
        logActionName = "Updated report status";
        logDetails = `Report ID: ${reportId} - Status changed from ${existingReport.status} to ${updates.status}`;
      }

      // Remove senderRole from updates before saving to report
      const { senderRole, ...reportUpdates } = updates;

      const updatedReport = await storage.updateReport(reportId, reportUpdates);
      if (!updatedReport) {
        return res.status(404).json({ error: "Report not found" });
      }

      await logAction(req, {
        userId,
        userName: user?.username,
        userRole: updates.senderRole || "admin",
        action: logActionName,
        affectedData: logDetails,
        module: "Reports",
        metadata: { reportId, changes: updates },
      });

      return res.json(updatedReport);
    } catch (error) {
      console.error("Error updating report:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update report";
      return res.status(500).json({ error: errorMessage });
    }
  });

  // Get messages for a report
  app.get("/api/reports/:id/messages", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const messages = await storage.getReportMessages(req.params.id);
      return res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      return res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.get("/api/reports/user/:userId", async (req, res) => {
    try {
      const reports = await storage.getReportsBySubmitter(req.params.userId);
      return res.json(reports);
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  // System logs routes
  app.get("/api/logs", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      // Check if user is admin (you may want to verify this from user table)
      const filters: any = {};
      if (req.query.role) filters.role = req.query.role as string;
      if (req.query.module) filters.module = req.query.module as string;
      if (req.query.userId) filters.userId = req.query.userId as string;
      if (req.query.search) filters.search = req.query.search as string;
      if (req.query.limit) filters.limit = parseInt(req.query.limit as string);

      const logs = await storage.getSystemLogs(filters);
      return res.json(logs);
    } catch (error) {
      console.error("Error fetching logs:", error);
      return res.status(500).json({ error: "Failed to fetch logs" });
    }
  });

  // Memos routes
  app.get("/api/memos", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const filters: any = {};
      // For residents, only show approved memos
      // For admin/officials, show all (they can filter by status in the UI)
      const showOnlyApproved = req.query.showOnlyApproved === 'true';
      if (showOnlyApproved) filters.showOnlyApproved = true;
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.category) filters.category = req.query.category as string;

      const memos = await storage.getMemos(filters);
      return res.json(memos);
    } catch (error) {
      console.error("Error fetching memos:", error);
      return res.status(500).json({ error: "Failed to fetch memos" });
    }
  });

  app.post("/api/memos", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { title, description, category, effectiveDate, fileUrl } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      // Admin can publish directly (status: approved), officials submit for approval (status: pending)
      const status = req.body.status || "pending";

      const memo = await storage.createMemo({
        title,
        description,
        category,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : null,
        fileUrl: fileUrl || null,
        issuedBy: req.session.userId,
        status,
      });

      await logAction(req, {
        userId: req.session.userId,
        userName: user?.username,
        userRole: status === "approved" ? "admin" : "official",
        action: status === "approved" ? "Published memo/ordinance" : "Created memo/ordinance request",
        affectedData: `Memo ID: ${memo.id}, Title: ${title}, Category: ${category}, Status: ${status}`,
        module: "Memos",
        metadata: { memoId: memo.id, category, status },
      });

      return res.status(201).json(memo);
    } catch (error) {
      console.error("Error creating memo:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create memo";
      return res.status(500).json({ error: errorMessage });
    }
  });

  app.patch("/api/memos/:id", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const updates = req.body;
    const memoId = req.params.id;

    // Validate status if it's being updated
    if (updates.status) {
      const validStatuses = ['pending', 'approved', 'rejected'];
      if (!validStatuses.includes(updates.status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
    }

    try {
      const user = await storage.getUser(req.session.userId);
      const allMemos = await storage.getMemos();
      const existingMemo = allMemos.find(m => m.id === memoId);

      if (!existingMemo) {
        return res.status(404).json({ error: "Memo not found" });
      }

      const updatedMemo = await storage.updateMemo(memoId, updates);
      if (!updatedMemo) {
        return res.status(404).json({ error: "Memo not found" });
      }

      let logActionName = "Updated memo/ordinance";
      if (updates.status === "approved") {
        logActionName = "Approved and published memo/ordinance";
      } else if (updates.status === "rejected") {
        logActionName = "Rejected memo/ordinance";
      }

      await logAction(req, {
        userId: req.session.userId,
        userName: user?.username,
        userRole: "admin",
        action: logActionName,
        affectedData: `Memo ID: ${memoId}, Title: ${existingMemo.title}, Status: ${existingMemo.status} → ${updates.status || existingMemo.status}`,
        module: "Memos",
        metadata: { memoId, changes: updates },
      });

      return res.json(updatedMemo);
    } catch (error) {
      console.error("Error updating memo:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update memo";
      return res.status(500).json({ error: errorMessage });
    }
  });

  return httpServer;
}
