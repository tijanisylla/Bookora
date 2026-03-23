import { getWpJsonBase } from "@/lib/wpJsonBase";
import type { WpJwtTokenResponse, WpUserMeResponse } from "@/types/wpUser";

const JWT_PATH =
  import.meta.env.VITE_WP_JWT_TOKEN_PATH ?? "jwt-auth/v1/token";

const REGISTER_PATH =
  import.meta.env.VITE_WP_REGISTER_PATH ?? "wp/v2/users";

async function readWpErrorMessage(res: Response): Promise<string> {
  try {
    const j: unknown = await res.json();
    if (j && typeof j === "object") {
      const o = j as Record<string, unknown>;
      if (typeof o.message === "string" && o.message.trim()) return o.message;
      if (typeof o.code === "string" && o.code.trim()) return o.code;
    }
  } catch {
    /* ignore */
  }
  return `Request failed (${res.status})`;
}

/**
 * JWT login (JWT Authentication for WP REST API — Tmeister, or compatible).
 * POST body: `username`, `password`
 */
export async function wpLogin(username: string, password: string): Promise<string> {
  const base = getWpJsonBase();
  const path = JWT_PATH.replace(/^\/+/, "");
  const res = await fetch(`${base}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = (await res.json().catch(() => ({}))) as WpJwtTokenResponse;
  if (!res.ok) {
    throw new Error(
      typeof data.message === "string" && data.message
        ? data.message
        : typeof data.code === "string"
          ? data.code
          : `Login failed (${res.status})`
    );
  }
  const token = data.token ?? data.data?.token;
  if (!token) throw new Error("Login succeeded but no token was returned.");
  return token;
}

export async function wpFetchCurrentUser(
  token: string
): Promise<WpUserMeResponse> {
  const base = getWpJsonBase();
  const res = await fetch(`${base}/wp/v2/users/me?context=edit`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(await readWpErrorMessage(res));
  }
  const u: unknown = await res.json();
  const o = u as Record<string, unknown>;
  return {
    id: Number(o.id),
    name: String(o.name ?? ""),
    slug: String(o.slug ?? ""),
    email: typeof o.email === "string" ? o.email : undefined,
  };
}

function buildRegisterBody(
  path: string,
  input: { username: string; email: string; password: string; name: string }
): Record<string, unknown> {
  if (path.includes("simple-jwt-login")) {
    return {
      username: input.username,
      email: input.email,
      password: input.password,
    };
  }
  return {
    username: input.username,
    email: input.email,
    password: input.password,
    name: input.name,
    roles: ["subscriber"],
  };
}

/**
 * Create a subscriber. Core REST usually requires a plugin or custom permission
 * to allow anonymous `POST /wp/v2/users`. Set `VITE_WP_REGISTER_PATH` to your
 * plugin route (e.g. Simple JWT Login) if needed.
 */
export async function wpRegister(input: {
  username: string;
  email: string;
  password: string;
  name: string;
}): Promise<{ jwt?: string }> {
  const base = getWpJsonBase();
  const path = REGISTER_PATH.replace(/^\/+/, "");
  const res = await fetch(`${base}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(buildRegisterBody(path, input)),
  });
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : `Registration failed (${res.status})`;
    throw new Error(msg || "Registration failed.");
  }
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    const jwt =
      typeof o.jwt === "string"
        ? o.jwt
        : typeof o.token === "string"
          ? o.token
          : undefined;
    if (jwt) return { jwt };
  }
  return {};
}

export function suggestUsernameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "user";
  const safe = local
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 60);
  return safe || "user";
}
