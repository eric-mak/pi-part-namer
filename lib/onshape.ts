import { cookies } from "next/headers";

export const ONSHAPE_API = "https://cad.onshape.com/api/v10";
export const ONSHAPE_OAUTH_AUTHORIZE = "https://oauth.onshape.com/oauth/authorize";
export const ONSHAPE_OAUTH_TOKEN = "https://oauth.onshape.com/oauth/token";

export const TOKEN_COOKIE = "onshape_token";

export interface OnshapeToken {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
}

export function clientCreds() {
  const id = process.env.ONSHAPE_CLIENT_ID;
  const secret = process.env.ONSHAPE_CLIENT_SECRET;
  const redirect = process.env.ONSHAPE_REDIRECT_URI;
  if (!id || !secret || !redirect) {
    throw new Error(
      "Missing ONSHAPE_CLIENT_ID / ONSHAPE_CLIENT_SECRET / ONSHAPE_REDIRECT_URI",
    );
  }
  return { id, secret, redirect };
}

export function authorizeUrl(state: string) {
  const { id, redirect } = clientCreds();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: id,
    redirect_uri: redirect,
    scope: "OAuth2Read OAuth2Write",
    state,
  });
  return `${ONSHAPE_OAUTH_AUTHORIZE}?${params}`;
}

export async function exchangeCode(code: string): Promise<OnshapeToken> {
  const { id, secret, redirect } = clientCreds();
  const res = await fetch(ONSHAPE_OAUTH_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirect,
      client_id: id,
      client_secret: secret,
    }),
  });
  if (!res.ok) throw new Error(`Onshape token exchange failed: ${res.status}`);
  const j = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
  return {
    access_token: j.access_token,
    refresh_token: j.refresh_token,
    expires_at: Date.now() + j.expires_in * 1000,
  };
}

export async function refreshToken(refresh: string): Promise<OnshapeToken> {
  const { id, secret } = clientCreds();
  const res = await fetch(ONSHAPE_OAUTH_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refresh,
      client_id: id,
      client_secret: secret,
    }),
  });
  if (!res.ok) throw new Error(`Onshape refresh failed: ${res.status}`);
  const j = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
  return {
    access_token: j.access_token,
    refresh_token: j.refresh_token ?? refresh,
    expires_at: Date.now() + j.expires_in * 1000,
  };
}

export async function readToken(): Promise<OnshapeToken | null> {
  const c = await cookies();
  const raw = c.get(TOKEN_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OnshapeToken;
  } catch {
    return null;
  }
}

export async function writeToken(tok: OnshapeToken) {
  const c = await cookies();
  c.set(TOKEN_COOKIE, JSON.stringify(tok), {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function requireToken(): Promise<OnshapeToken> {
  const tok = await readToken();
  if (!tok) throw new Error("NOT_AUTHORIZED");
  if (tok.expires_at - 60_000 > Date.now()) return tok;
  if (!tok.refresh_token) throw new Error("NOT_AUTHORIZED");
  const fresh = await refreshToken(tok.refresh_token);
  await writeToken(fresh);
  return fresh;
}

export async function onshapeFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const tok = await requireToken();
  return fetch(`${ONSHAPE_API}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${tok.access_token}`,
      Accept: "application/json;charset=UTF-8; qs=0.09",
    },
  });
}
