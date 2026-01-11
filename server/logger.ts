import type { Request } from "express";
import { storage } from "./storage";

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "unknown";
}

function getUserAgent(req: Request): string {
  return req.headers["user-agent"] || "unknown";
}

export async function logAction(
  req: Request,
  options: {
    userId?: string;
    userName?: string;
    userRole?: string;
    action: string;
    affectedData?: string;
    module: string;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  try {
    // If userId is provided, fetch user details if not provided
    if (options.userId && !options.userName) {
      const user = await storage.getUser(options.userId);
      if (user) {
        options.userName = user.username;
        // Note: Role would need to come from client or be stored in users table
      }
    }

    await storage.createSystemLog({
      userId: options.userId || null,
      userName: options.userName || null,
      userRole: options.userRole || null,
      action: options.action,
      affectedData: options.affectedData || null,
      module: options.module,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      metadata: options.metadata || null,
    });
  } catch (error) {
    // Don't fail the request if logging fails
    console.error("Error logging action:", error);
  }
}
