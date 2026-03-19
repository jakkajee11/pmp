/**
 * Auth Feature Public Exports
 *
 * Only export what other features need to use.
 */

// Types
export type { SessionUser, Session, AuthState, JwtPayload } from "./types";

// Components
export { SessionProvider } from "./components/session-provider";

// Hooks
export {
  useSession,
  useRequireAuth,
  useHasRole,
  useHasAnyRole,
} from "./hooks/use-session";

// API
export { authOptions } from "./api/session";
