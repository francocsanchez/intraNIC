import type { Usuario } from "@/types/index";

type AuthUser = Usuario | null | undefined;

type AccessOptions = {
  roles?: string[];
  companies?: string[];
};

export function hasAnyRole(user: AuthUser, allowedRoles: string[]) {
  const roles = user?.role ?? [];
  return roles.some((role: string) => allowedRoles.includes(role));
}

export function hasAnyCompany(user: AuthUser, allowedCompanies: string[]) {
  const companies = user?.company ?? [];
  return companies.some((company: string) => allowedCompanies.includes(company));
}

export function hasAccess(user: AuthUser, options: AccessOptions) {
  const matchesRole = options.roles ? hasAnyRole(user, options.roles) : true;
  const matchesCompany = options.companies
    ? hasAnyCompany(user, options.companies)
    : true;

  return matchesRole && matchesCompany;
}
