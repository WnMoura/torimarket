export const roles = ["admin", "gerente", "vendedor"] as const;
export type Role = (typeof roles)[number];

export const permissions = {
  admin: ["dashboard", "sales", "products", "clients", "goals", "cash", "dre", "insights", "settings", "team", "audit", "restore"],
  gerente: ["dashboard", "sales", "sales_cancel", "products", "clients", "goals", "cash", "dre", "insights", "audit", "restore"],
  vendedor: ["dashboard", "sales", "products", "clients"],
} as const satisfies Record<Role, readonly string[]>;

export function can(role: Role, permission: string) {
  return (permissions[role] as readonly string[]).includes(permission);
}

export function roleLabel(role: Role) {
  return { admin: "Administrador", gerente: "Gerente", vendedor: "Vendedor" }[role];
}
