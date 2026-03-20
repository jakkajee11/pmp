/**
 * Org Chart Types
 *
 * Type definitions for organization chart visualization.
 */

import { z } from "zod";
import { UserRole } from "@/shared/types/common";

/**
 * Org chart node for visualization
 */
export interface OrgChartNode {
  id: string;
  name: string;
  nameTh?: string;
  role: UserRole;
  department?: string;
  email: string;
  position?: { x: number; y: number };
  directReports: OrgChartNode[];
}

/**
 * Flat org chart node for React Flow
 */
export interface OrgFlowNode {
  id: string;
  type: "orgNode";
  data: {
    name: string;
    nameTh?: string;
    role: UserRole;
    department?: string;
    email: string;
    directReportsCount: number;
  };
  position: { x: number; y: number };
}

/**
 * Org chart edge for React Flow
 */
export interface OrgFlowEdge {
  id: string;
  source: string;
  target: string;
  type: "smoothstep";
}

/**
 * Org chart filter options
 */
export interface OrgChartFilters {
  rootUserId?: string;
  depth?: number;
  departmentId?: string;
}

/**
 * Query parameters for org chart
 */
export const OrgChartQuerySchema = z.object({
  rootUserId: z.string().uuid().optional(),
  depth: z.coerce.number().int().min(1).max(10).default(3),
  departmentId: z.string().uuid().optional(),
});
