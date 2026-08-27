import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";

// Paths that should remain reachable without a session.
const PUBLIC_PATHS = ["/login", "/auth/callback", "/api/cron"];

// The Edge middleware is killed by Vercel after 25s. Supabase's auth client
// retries a failed token refresh for up to 30s, so an unbounded getUser() call
// takes the whole site down with a 504. Fail fast and let the page re-check.
const AUTH_TIMEOUT_MS = 3000;

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function hasAuthCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some(({ name }) => name.startsWith("sb-") && name.includes("auth-token"));
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return await Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("supabase auth timeout")), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const passthrough = () => NextResponse.next({ request: { headers: request.headers } });

  const loginRedirect = () => {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  };

  // Supabase not configured yet — let every request through so the local-seed app keeps working.
  if (!isSupabaseConfigured()) {
    return passthrough();
  }

  // No session cookie at all: no need to hit Supabase over the network.
  if (!hasAuthCookie(request)) {
    return isPublicPath(pathname) ? passthrough() : loginRedirect();
  }

  let response = passthrough();

  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({ request: { headers: request.headers } });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: "", ...options });
        response = NextResponse.next({ request: { headers: request.headers } });
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  let user: { id: string } | null = null;
  try {
    const { data } = await withTimeout(supabase.auth.getUser(), AUTH_TIMEOUT_MS);
    user = data.user;
  } catch {
    // Supabase auth is slow or unreachable. Anything behind the app shell would
    // hang on the same backend, so send people to /login — it renders fully
    // client-side — instead of letting the request die in a 504.
    return isPublicPath(pathname) ? response : loginRedirect();
  }

  if (!user && !isPublicPath(pathname)) {
    return loginRedirect();
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.delete("next");
    return NextResponse.redirect(url);
  }

  return response;
}
