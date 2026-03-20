/**
 * Integration Tests for Evaluation API
 *
 * Tests PUT /api/evaluations/:id/self and POST /api/evaluations/:id/self/submit endpoints.
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
  updateSelfEvalHandler,
  submitSelfEvalHandler,
  getEvaluationHandler,
} from "../../../../src/features/evaluations/api/handlers";
import { prisma } from "../../../../src/shared/lib/db";
import { requireAuth, hasRole } from "../../../../src/shared/api/middleware";

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("Evaluation API Tests", () => {
  const testUserId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
  const testManagerId = "b2c3d4e5-f6a7-8901-bcde-f12345678901";
  const testEvaluationId = "c3d4e5f6-a7b8-9012-cdef-123456789012";
  const testCycleId = "d4e5f6a7-b8c9-0123-def1-234567890123";
  const testObjectiveId = "e5f6a7b8-c9d0-1234-ef12-345678901234";

  const mockEvaluation = {
    id: testEvaluationId,
    employeeId: testUserId,
    managerId: testManagerId,
    cycleId: testCycleId,
    objectiveId: testObjectiveId,
    coreValueId: null,
    evaluationType: "KPI",
    selfRating: null,
    selfComments: null,
    selfSubmittedAt: null,
    managerRating: null,
    managerFeedback: null,
    managerReviewedAt: null,
    status: "SELF_IN_PROGRESS",
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockEvaluationWithRelations = {
    ...mockEvaluation,
    employee: { id: testUserId, name: "Test User", email: "test@example.com" },
    manager: { id: testManagerId, name: "Test Manager" },
    cycle: {
      id: testCycleId,
      name: "Test Cycle",
      type: "MID_YEAR",
      weightsConfig: { kpi: 0.8, coreValues: 0.2 },
    },
    objective: {
      id: testObjectiveId,
      title: "Test Objective",
      description: "Test description",
      rating1Desc: "Below",
      rating2Desc: "Needs improvement",
      rating3Desc: "Meets",
      rating4Desc: "Above",
      rating5Desc: "Exceeds",
    },
    coreValue: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (requireAuth as jest.Mock).mockResolvedValue({
      userId: testUserId,
      role: "EMPLOYEE",
      email: "test@example.com",
    });
    (hasRole as jest.Mock).mockReturnValue(false);
  });

  describe("PUT /api/evaluations/:id/self", () => {
    it("should update self-evaluation successfully", async () => {
      (mockPrisma.evaluation.findUnique as jest.Mock).mockResolvedValue(mockEvaluation);
      (mockPrisma.evaluation.update as jest.Mock).mockResolvedValue({
        ...mockEvaluation,
        selfRating: 4,
        selfComments: "Good progress",
        status: "SELF_IN_PROGRESS",
        version: 2,
      });

      const request = new NextRequest("http://localhost/api/evaluations/test/self", {
        method: "PUT",
        body: JSON.stringify({
          selfRating: 4,
          selfComments: "Good progress",
          version: 1,
        }),
      });

      const response = await updateSelfEvalHandler(request, {
        params: { id: testEvaluationId },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.selfRating).toBe(4);
    });

    it("should reject update from non-owner", async () => {
      (requireAuth as jest.Mock).mockResolvedValue({
        userId: "other-user-id",
        role: "EMPLOYEE",
        email: "other@example.com",
      });

      (mockPrisma.evaluation.findUnique as jest.Mock).mockResolvedValue(mockEvaluation);

      const request = new NextRequest("http://localhost/api/evaluations/test/self", {
        method: "PUT",
        body: JSON.stringify({
          selfRating: 3,
          selfComments: "Attempted update",
          version: 1,
        }),
      });

      const response = await updateSelfEvalHandler(request, {
        params: { id: testEvaluationId },
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe("FORBIDDEN");
    });

    it("should reject update with version mismatch", async () => {
      (mockPrisma.evaluation.findUnique as jest.Mock).mockResolvedValue({
        ...mockEvaluation,
        version: 5, // Server has version 5
      });

      const request = new NextRequest("http://localhost/api/evaluations/test/self", {
        method: "PUT",
        body: JSON.stringify({
          selfRating: 5,
          selfComments: "Updated with wrong version",
          version: 1, // Client has version 1
        }),
      });

      const response = await updateSelfEvalHandler(request, {
        params: { id: testEvaluationId },
      });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error.code).toBe("CONFLICT");
    });

    it("should not update already submitted evaluation", async () => {
      (mockPrisma.evaluation.findUnique as jest.Mock).mockResolvedValue({
        ...mockEvaluation,
        status: "SELF_SUBMITTED",
      });

      const request = new NextRequest("http://localhost/api/evaluations/test/self", {
        method: "PUT",
        body: JSON.stringify({
          selfRating: 5,
          selfComments: "Attempted update after submit",
          version: 1,
        }),
      });

      const response = await updateSelfEvalHandler(request, {
        params: { id: testEvaluationId },
      });
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error.code).toBe("BUSINESS_RULE");
    });
  });

  describe("POST /api/evaluations/:id/self/submit", () => {
    it("should submit self-evaluation successfully", async () => {
      (mockPrisma.evaluation.findUnique as jest.Mock).mockResolvedValue({
        ...mockEvaluation,
        selfRating: 4,
        status: "SELF_IN_PROGRESS",
      });
      (mockPrisma.evaluation.update as jest.Mock).mockResolvedValue({
        ...mockEvaluation,
        status: "SELF_SUBMITTED",
        selfSubmittedAt: new Date(),
        version: 2,
      });

      const request = new NextRequest("http://localhost/api/evaluations/test/self/submit", {
        method: "POST",
        body: JSON.stringify({ version: 1 }),
      });

      const response = await submitSelfEvalHandler(request, {
        params: { id: testEvaluationId },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe("SELF_SUBMITTED");
    });

    it("should reject submit without self-rating", async () => {
      (mockPrisma.evaluation.findUnique as jest.Mock).mockResolvedValue({
        ...mockEvaluation,
        selfRating: null,
        status: "SELF_IN_PROGRESS",
      });

      const request = new NextRequest("http://localhost/api/evaluations/test/self/submit", {
        method: "POST",
        body: JSON.stringify({ version: 1 }),
      });

      const response = await submitSelfEvalHandler(request, {
        params: { id: testEvaluationId },
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject submit from non-owner", async () => {
      (requireAuth as jest.Mock).mockResolvedValue({
        userId: "other-user-id",
        role: "EMPLOYEE",
        email: "other@example.com",
      });

      (mockPrisma.evaluation.findUnique as jest.Mock).mockResolvedValue({
        ...mockEvaluation,
        selfRating: 4,
      });

      const request = new NextRequest("http://localhost/api/evaluations/test/self/submit", {
        method: "POST",
        body: JSON.stringify({ version: 1 }),
      });

      const response = await submitSelfEvalHandler(request, {
        params: { id: testEvaluationId },
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe("FORBIDDEN");
    });

    it("should reject double submit", async () => {
      (mockPrisma.evaluation.findUnique as jest.Mock).mockResolvedValue({
        ...mockEvaluation,
        status: "SELF_SUBMITTED",
        selfRating: 4,
      });

      const request = new NextRequest("http://localhost/api/evaluations/test/self/submit", {
        method: "POST",
        body: JSON.stringify({ version: 1 }),
      });

      const response = await submitSelfEvalHandler(request, {
        params: { id: testEvaluationId },
      });
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error.code).toBe("BUSINESS_RULE");
    });
  });

  describe("GET /api/evaluations/:id", () => {
    it("should return evaluation details for owner", async () => {
      (mockPrisma.evaluation.findUnique as jest.Mock).mockResolvedValue(mockEvaluationWithRelations);

      const request = new NextRequest("http://localhost/api/evaluations/test");

      const response = await getEvaluationHandler(request, {
        params: { id: testEvaluationId },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(testEvaluationId);
    });

    it("should return evaluation details for manager", async () => {
      (requireAuth as jest.Mock).mockResolvedValue({
        userId: testManagerId,
        role: "LINE_MANAGER",
        email: "manager@example.com",
      });

      (mockPrisma.evaluation.findUnique as jest.Mock).mockResolvedValue(mockEvaluationWithRelations);

      const request = new NextRequest("http://localhost/api/evaluations/test");

      const response = await getEvaluationHandler(request, {
        params: { id: testEvaluationId },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should deny access to unrelated user", async () => {
      (requireAuth as jest.Mock).mockResolvedValue({
        userId: "unrelated-user-id",
        role: "EMPLOYEE",
        email: "unrelated@example.com",
      });

      (mockPrisma.evaluation.findUnique as jest.Mock).mockResolvedValue(mockEvaluationWithRelations);

      const request = new NextRequest("http://localhost/api/evaluations/test");

      const response = await getEvaluationHandler(request, {
        params: { id: testEvaluationId },
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe("FORBIDDEN");
    });

    it("should return 404 for non-existent evaluation", async () => {
      (mockPrisma.evaluation.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest("http://localhost/api/evaluations/test");

      const response = await getEvaluationHandler(request, {
        params: { id: "00000000-0000-0000-0000-000000000000" },
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.code).toBe("NOT_FOUND");
    });
  });
});
