/**
 * Supabase Auth stores a technical email as each account identifier.
 * Staff authenticate only with username and password; no real mailbox is needed.
 * Provision accounts exclusively through the trusted Supabase Auth administrator UI.
 */
export const INTERNAL_LOGIN_DOMAIN = "acesso.jonathanveiculos.com.br";

const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{1,30}[a-z0-9]$/;

export function normalizeAdminUsername(value: string): string | null {
  const username = value.trim().toLowerCase();
  if (!USERNAME_PATTERN.test(username) || username.includes("..")) return null;
  return username;
}

export function adminUsernameToAuthEmail(value: string): string | null {
  const username = normalizeAdminUsername(value);
  return username ? `${username}@${INTERNAL_LOGIN_DOMAIN}` : null;
}
