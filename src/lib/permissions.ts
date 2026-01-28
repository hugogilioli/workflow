export type Role = "VIEWER" | "OPERATOR" | "ADMIN";

export function canManageUsers(role: Role) {
  return role === "ADMIN";
}
export function canEditMaterials(role: Role) {
  return role === "OPERATOR" || role === "ADMIN";
}
export function canCreateRequests(role: Role) {
  return role === "OPERATOR" || role === "ADMIN";
}
export function canDeleteAnything(role: Role) {
  return role === "ADMIN";
}
export function canExport(role: Role) {
  return role === "VIEWER" || role === "OPERATOR" || role === "ADMIN";
}
