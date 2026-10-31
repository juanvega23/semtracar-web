export { RequireAccess, HomeRedirect } from './components/RequireAccess';
export { RequireAuth } from './components/RequireAuth';
export { useCurrentUser, useRequiredCurrentUser, currentUserKey } from './hooks/useCurrentUser';
export { accesoRoutes } from './routes';
export {
  accessFor,
  canAccess,
  homePathFor,
  resolveRole,
  ROLE_LABELS,
  type Access,
  type Role,
  type Section,
  type WebRole,
} from './roles';
export type { CurrentUser } from './services/currentUserService';
