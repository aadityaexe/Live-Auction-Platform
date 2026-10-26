import AuditLog, { AuditAction } from "../models/AuditLog.js";
import { logger } from "./logger.js";

interface AuditParams {
  userId?: string;
  action: AuditAction;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export const logAudit = async (params: AuditParams): Promise<void> => {
  try {
    AuditLog.create(params).catch((err) => {
      logger.error("Failed to write to AuditLog", { error: err.message, params });
    });
  } catch (err) {
    logger.error("Synchronous error initiating AuditLog write", { error: err instanceof Error ? err.message : String(err) });
  }
};
