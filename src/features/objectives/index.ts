/**
 * Objectives Feature
 *
 * Public exports for the objectives feature module.
 */

// Types
export * from "./types";

// API Handlers
export {
  getObjectivesHandler,
  getObjectiveHandler,
  createObjectiveHandler,
  updateObjectiveHandler,
  deleteObjectiveHandler,
  bulkAssignObjectivesHandler,
  copyObjectiveHandler,
} from "./api/handlers";

// Components
export { ObjectiveForm } from "./components/objective-form";
export { ObjectiveCard } from "./components/objective-card";
export { RatingCriteriaEditor } from "./components/rating-criteria-editor";
export { BulkAssignDialog } from "./components/bulk-assign-dialog";

// Hooks
export { useObjectives, useObjective } from "./hooks/use-objectives";
export { useObjectiveMutations } from "./hooks/use-objective-mutations";
