/**
 * Integration Tests for Manager Review API
 *
 * Tests PUT /api/evaluations/:id/manager and POST /api/evaluations/:id/manager/submit endpoints.
 */

import { NextRequest } from "next/server";

// Mock prisma first before any imports
jest.mock("../../../../src/shared/lib/db", () => ({
  prisma: {
    evaluation: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

// Mock the auth middleware
jest.mock("../../../../src/shared/api/middleware", () => ({
  requireAuth: jest.fn(),
  requireRole: jest.fn(),
  hasRole: jest.fn(),
}));

// Mock the audit log
jest.mock("../../../../src/shared/lib/audit", () => ({
  auditLog: jest.fn(),
  extractClientIp: jest.fn(() => "127.0.0.1"),
  extractUserAgent: jest.fn(() => "test-agent"),
}));

// Import after mocks are set up
import {
  updateManagerReviewHandler,
  submitManagerReviewHandler,
  returnEvaluationHandler,
} from "../../../../src/features/evaluations/api/handlers";
import { prisma } from "../../../../src/shared/lib/db";
import { requireAuth, hasRole } from "../../../../src/shared/api/middleware";

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("Manager Review API Tests", () => {
  const testEmployeeId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
  const testManagerId = "b2c3d4e5-f6a7-8901-bcde-f12345678901";
  const testEvaluationId = "c3d4e5f6-a7b8-9012-cdef-123456789012";

  const mockEvaluation = {
    id: testEvaluationId,
    employeeId: testEmployeeId,
    managerId: testManagerId,
    cycleId: "d4e5f6a7-b8c9-0123-def1-234567890123",
    objectiveId: "e5f6a7b8-c9d0-1234-ef12-345678901234",
    coreValueId: null,
    evaluationType: "KPI",
    selfRating: 4,
    selfComments: "Good progress",
    selfSubmittedAt: new Date(),
    managerRating: null,
    managerFeedback: null,
    managerReviewedAt: null,
    status: "SELF_SUBMITTED",
    version: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (requireAuth as jest.Mock).mockResolvedValue({
      userId: testManagerId,
      role: "LINE_MANAGER",
      email: "manager@example.com",
    });
    (hasRole as jest.Mock).mockReturnValue(true);
  });

  describe("PUT /api/evaluations/:id/manager", () => {
    it("should update manager review successfully", async () => {
      (mockPrisma.evaluation.findUnique as jest.Mock).mockResolvedValue(mockEvaluation);
      (mockPrisma.evaluation.update as jest.Mock).mockResolvedValue({
        ...mockEvaluation,
        managerRating: 4,
        managerFeedback: "Excellent work",
        status: "MANAGER_IN_PROGRESS",
        version: 3,
      });

      const request = new NextRequest("http://localhost/api/evaluations/test/manager", {
        method: "PUT",
        body: JSON.stringify({
          managerRating: 4,
          managerFeedback: "Excellent work",
          version: 2,
        }),
      });

      const response = await updateManagerReviewHandler(request, {
        params: { id: testEvaluationId },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.managerRating).toBe(4);
    });

    it("should reject update from non-assigned manager", async () => {
      (requireAuth as jest.Mock).mockResolvedValue({
        userId: "other-manager-id",
        role: "LINE_MANAGER",
        email: "other@example.com",
      });

      (mockPrisma.evaluation.findUnique as jest.Mock).mockResolvedValue(mockEvaluation);

      const request = new NextRequest("http://localhost/api/evaluations/test/manager", {
        method: "PUT",
        body: JSON.stringify({
          managerRating: 3,
          managerFeedback: "Attempted update",
          version: 2,
        }),
      });

      const response = await updateManagerReviewHandler(request, {
        params: { id: testEvaluationId },
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe("FORBIDDEN");
    });

    it("should reject update with version mismatch", async () => {
      (mockPrisma.evaluation.findUnique as jest.Mock).mockResolvedValue({
        ...mockEvaluation,
        version: 5,
      });

      const request = new NextRequest("http://localhost/api/evaluations/test/manager", {
        method: "PUT",
        body: JSON.stringify({
          managerRating: 5,
          managerFeedback: "Updated with wrong version",
          version: 2,
        }),
      });

      const response = await updateManagerReviewHandler(request, {
        params: { id: testEvaluationId },
      });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error.code).toBe("CONFLICT");
    });

    it("should reject update before self-evaluation submitted", async () => {
      (mockPrisma.evaluation.findUnique as jest.Mock).mockResolvedValue({
        ...mockEvaluation,
        status: "SELF_IN_PROGRESS",
      });

      const request = new NextRequest("http://localhost/api/evaluations/test/manager", {
        method: "PUT",
        body: JSON.stringify({
          managerRating: 5,
          managerFeedback: "Attempted review",
          version: 2,
        }),
      });

      const response = await updateManagerReviewHandler(request, {
        params: { id: testEvaluationId },
      });
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error.code).toBe("BUSINESS_RULE");
    });
  });

  describe("POST /api/evaluations/:id/manager/submit", () => {
    it("should submit manager review successfully", async () => {
      (mockPrisma.evaluation.findUnique as jest.Mock).mockResolvedValue({
        ...mockEvaluation,
        managerRating: 4,
        managerFeedback: "Great work",
        status: "MANAGER_IN_PROGRESS",
      });
      (mockPrisma.evaluation.update as jest.Mock).mockResolvedValue({
        ...mockEvaluation,
        status: "COMPLETED",
        managerReviewedAt: new Date(),
        version: 3,
      });

      const request = new NextRequest("http://localhost/api/evaluations/test/manager/submit", {
        method: "POST",
        body: JSON.stringify({ version: 2 }),
      });

      const response = await submitManagerReviewHandler(request, {
        params: { id: testEvaluationId },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe("COMPLETED");
    });

    it("should reject submit without manager rating", async () => {
      (mockPrisma.evaluation.findUnique as jest.Mock).mockResolvedValue({
        ...mockEvaluation,
        managerRating: null,
        status: "MANAGER_IN_PROGRESS",
      });

      const request = new NextRequest("http://localhost/api/evaluations/test/manager/submit", {
        method: "POST",
        body: JSON.stringify({ version: 2 }),
      });

      const response = await submitManagerReviewHandler(request, {
        params: { id: testEvaluationId },
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject submit from non-assigned manager", async () => {
      (requireAuth as jest.Mock).mockResolvedValue({
        userId: "other-manager-id",
        role: "LINE_MANAGER",
        email: "other@example.com",
      });

      (mockPrisma.evaluation.findUnique as jest.Mock).mockResolvedValue({
        ...mockEvaluation,
        managerRating: 4,
      });

      const request = new NextRequest("http://localhost/api/evaluations/test/manager/submit", {
        method: "POST",
        body: JSON.stringify({ version: 2 }),
      });

      const response = await submitManagerReviewHandler(request, {
        params: { id: testEvaluationId },
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe("FORBIDDEN");
    });

    it("should reject double submit", async () => {
      (mockPrisma.evaluation.findUnique as jest.Mock).mockResolvedValue({
        ...mockEvaluation,
        status: "COMPLETED",
        managerRating: 4,
      });

      const request = new NextRequest("http://localhost/api/evaluations/test/manager/submit", {
        method: "POST",
        body: JSON.stringify({ version: 2 }),
      });

      const response = await submitManagerReviewHandler(request, {
        params: { id: testEvaluationId },
      });
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error.code).toBe("BUSINESS_RULE");
    });
  });

  describe("POST /api/evaluations/:id/return", () => {
    it("should return evaluation to employee successfully", async () => {
      (mockPrisma.evaluation.findUnique as jest.Mock).mockResolvedValue(mockEvaluation);
      (mockPrisma.evaluation.update as jest.Mock).mockResolvedValue({
        ...mockEvaluation,
        status: "RETURNED",
        version: 3,
      });

      const request = new NextRequest("http://localhost/api/evaluations/test/return", {
        method: "POST",
        body: JSON.stringify({ reason: "Needs more detail" }),
      });

      const response = await returnEvaluationHandler(request, {
        params: { id: testEvaluationId },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe("RETURNED");
    });

    it("should reject return from non-assigned manager", async () => {
      (requireAuth as jest.Mock).mockResolvedValue({
        userId: "other-manager-id",
        role: "LINE_MANAGER",
        email: "other@example.com",
      });

      (mockPrisma.evaluation.findUnique as jest.Mock).mockResolvedValue(mockEvaluation);

      const request = new NextRequest("http://localhost/api/evaluations/test/return", {
        method: "POST",
        body: JSON.stringify({ reason: "Not allowed" }),
      });

      const response = await returnEvaluationHandler(request, {
        params: { id: testEvaluationId },
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe("FORBIDDEN");
    });

    it("should reject return without reason", async () => {
      (mockPrisma.evaluation.findUnique as jest.Mock).mockResolvedValue(mockEvaluation);

      const request = new NextRequest("http://localhost/api/evaluations/test/return", {
        method: "POST",
        body: JSON.stringify({ reason: "" }),
      });

      // The validator throws an error for empty reason
      await expect(returnEvaluationHandler(request, {
        params: { id: testEvaluationId },
      })).rejects.toThrow("Reason is required");
    });

    it("should reject return for completed evaluation", async () => {
      (mockPrisma.evaluation.findUnique as jest.Mock).mockResolvedValue({
        ...mockEvaluation,
        status: "COMPLETED",
      });

      const request = new NextRequest("http://localhost/api/evaluations/test/return", {
        method: "POST",
        body: JSON.stringify({ reason: "Too late" }),
      });

      const response = await returnEvaluationHandler(request, {
        params: { id: testEvaluationId },
      });
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error.code).toBe("BUSINESS_RULE");
    });
  });
});
