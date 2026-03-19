/**
 * Org Chart API Handlers
 *
 * Handles organization chart data retrieval.
 */

import { NextRequest } from "next/server";
import { prisma } from "../../../shared/lib/db";
import { successResponse, errorResponse } from "../../../shared/api/response";
import { requireAuth } from "../../../shared/api/middleware";
import { OrgChartNode, OrgChartQuerySchema, OrgFlowNode, OrgFlowEdge } from "../types";

/**
 * GET /api/org-chart - Get organization chart data
 */
export async function getOrgChartHandler(request: NextRequest) {
  await requireAuth();

  const { searchParams } = new URL(request.url);
  const params = {
    rootUserId: searchParams.get("root_user_id") ?? undefined,
    depth: searchParams.get("depth") ?? undefined,
    departmentId: searchParams.get("department_id") ?? undefined,
  };

  const validated = OrgChartQuerySchema.parse(params);
  const maxDepth = validated.depth ?? 3;

  // Build org chart tree
  let rootUserId = validated.rootUserId;

  if (!rootUserId) {
    // Find top-level user (no manager)
    const topLevelUser = await prisma.user.findFirst({
      where: {
        isActive: true,
        managerId: null,
        role: { in: ["SUPER_ADMIN", "HR_ADMIN", "SENIOR_MANAGER"] },
      },
      orderBy: { role: "asc" },
    });

    if (!topLevelUser) {
      return successResponse(null);
    }

    rootUserId = topLevelUser.id;
  }

  // Recursive function to build org tree
  async function buildOrgTree(
    userId: string,
    currentDepth: number
  ): Promise<OrgChartNode | null> {
    if (currentDepth > maxDepth) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: { select: { name: true } },
      },
    });

    if (!user || !user.isActive) return null;

    // Filter by department if specified
    if (validated.departmentId && user.departmentId !== validated.departmentId) {
      return null;
    }

    // Get direct reports
    const directReports = await prisma.user.findMany({
      where: {
        managerId: userId,
        isActive: true,
        ...(validated.departmentId && { departmentId: validated.departmentId }),
      },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });

    const children: OrgChartNode[] = [];
    for (const report of directReports) {
      const childNode = await buildOrgTree(report.id, currentDepth + 1);
      if (childNode) {
        children.push(childNode);
      }
    }

    return {
      id: user.id,
      name: user.name,
      nameTh: user.nameTh ?? undefined,
      role: user.role as any,
      department: user.department?.name,
      email: user.email,
      directReports: children,
    };
  }

  const orgTree = rootUserId ? await buildOrgTree(rootUserId, 1) : null;

  return successResponse(orgTree);
}

/**
 * GET /api/org-chart/flat - Get flat nodes and edges for React Flow
 */
export async function getOrgChartFlatHandler(request: NextRequest) {
  await requireAuth();

  const { searchParams } = new URL(request.url);
  const params = {
    rootUserId: searchParams.get("root_user_id") ?? undefined,
    depth: searchParams.get("depth") ?? undefined,
    departmentId: searchParams.get("department_id") ?? undefined,
  };

  const validated = OrgChartQuerySchema.parse(params);
  const maxDepth = validated.depth ?? 3;

  // Find root user
  let rootUserId = validated.rootUserId;

  if (!rootUserId) {
    const topLevelUser = await prisma.user.findFirst({
      where: {
        isActive: true,
        managerId: null,
        role: { in: ["SUPER_ADMIN", "HR_ADMIN", "SENIOR_MANAGER"] },
      },
      orderBy: { role: "asc" },
    });

    if (!topLevelUser) {
      return successResponse({ nodes: [], edges: [] });
    }

    rootUserId = topLevelUser.id;
  }

  const nodes: OrgFlowNode[] = [];
  const edges: OrgFlowEdge[] = [];

  // Helper to calculate positions
  const levelY = 150;

  async function buildFlatOrg(
    userId: string,
    parentId: string | null,
    currentDepth: number,
    x: number
  ): Promise<number> {
    if (currentDepth > maxDepth) return x;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: { select: { name: true } },
        _count: { select: { directReports: true } },
      },
    });

    if (!user || !user.isActive) return x;

    // Filter by department if specified
    if (validated.departmentId && user.departmentId !== validated.departmentId) {
      return x;
    }

    // Add node
    const node: OrgFlowNode = {
      id: user.id,
      type: "orgNode",
      data: {
        name: user.name,
        nameTh: user.nameTh ?? undefined,
        role: user.role as any,
        department: user.department?.name,
        email: user.email,
        directReportsCount: user._count.directReports,
      },
      position: { x, y: (currentDepth - 1) * levelY },
    };
    nodes.push(node);

    // Add edge from parent
    if (parentId) {
      edges.push({
        id: `${parentId}-${user.id}`,
        source: parentId,
        target: user.id,
        type: "smoothstep",
      });
    }

    // Get direct reports
    const directReports = await prisma.user.findMany({
      where: {
        managerId: userId,
        isActive: true,
        ...(validated.departmentId && { departmentId: validated.departmentId }),
      },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });

    let childX = x;
    const startX = x;
    const childSpacing = 250;

    for (const report of directReports) {
      childX = await buildFlatOrg(report.id, user.id, currentDepth + 1, childX);
      childX += childSpacing;
    }

    // Adjust parent position to center over children
    if (directReports.length > 0) {
      const endX = childX - childSpacing;
      node.position.x = (startX + endX) / 2;
      return endX;
    }

    return x;
  }

  if (rootUserId) {
    await buildFlatOrg(rootUserId, null, 1, 0);
  }

  return successResponse({ nodes, edges });
}
