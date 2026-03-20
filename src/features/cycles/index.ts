/**
 * Cycles Feature Public Exports
 *
 * Public API for the cycles feature module.
 */

// Types
export type {
  CycleType,
  CycleStatus,
  WeightsConfig,
  ReviewCycle,
  ReviewCycleWithStats,
  ReviewCycleListItem,
  CycleListParams,
  CreateCycleRequest,
  UpdateCycleRequest,
  DeadlineExtensionRequest,
  DeadlineExtension,
} from "./types";

export {
  CYCLE_TYPES,
  CYCLE_STATUSES,
  CYCLE_TYPE_LABELS,
  CYCLE_TYPE_LABELS_TH,
  CYCLE_STATUS_LABELS,
  CYCLE_STATUS_LABELS_TH,
  CYCLE_STATUS_COLORS,
  DEFAULT_WEIGHTS,
  CycleTypeSchema,
  CycleStatusSchema,
  WeightsConfigSchema,
  CreateCycleSchema,
  UpdateCycleSchema,
  CycleListQuerySchema,
  DeadlineExtensionSchema,
  CycleIdSchema,
} from "./types";

// Import types that need the schema
import { CreateCycleSchema } from "./types";
import { ReviewCycleListItem } from "./types";

// API Handlers
export {
  getCyclesHandler,
  getActiveCycleHandler,
  getCycleHandler,
  createCycleHandler,
  updateCycleHandler,
  activateCycleHandler,
  closeCycleHandler,
  grantExtensionHandler,
  deleteCycleHandler,
} from "./api/handlers";

// Validators
export {
  validateCreateCycle,
  validateUpdateCycle,
  validateCycleListQuery,
  validateCycleId,
  validateDeadlineExtension,
  validateActivatePreconditions,
  validateClosePreconditions,
} from "./api/validators";

// Components
export { CycleForm } from "./components/cycle-form";
export { CycleList } from "./components/cycle-list";
export { DeadlineConfig } from "./components/deadline-config";
export { CycleStatusBadge } from "./components/cycle-status-badge";
export { WeightedScoreConfig } from "./components/weighted-score-config";

// Hooks
export { useCycles } from "./hooks/use-cycles";
export { useActiveCycle } from "./hooks/use-active-cycle";
