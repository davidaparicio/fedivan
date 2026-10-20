import { useCallback, useEffect, useRef, useState } from "react";
import type { TimelineResponse, PlatformStatuses } from "fedivan-shared";

const POLL_INTERVAL = 90_000;

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...init });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export function useTimeline() {
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const timer = useRef<ReturnType<typeof setInterval>>();

  const refresh = useCallback(async () => {
    try {
      const tl = await fetchJson<TimelineResponse>("/api/timeline");
      setData(tl);
    } catch {
      // keep last good data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    timer.current = setInterval(refresh, POLL_INTERVAL);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(timer.current);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  return { data, loading, refresh };
}

export async function connectBluesky(identifier: string, appPassword: string) {
  return fetchJson<{ ok: boolean; handle: string }>("/api/auth/bluesky", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, appPassword }),
  });
}

export async function disconnectBluesky() {
  return fetchJson("/api/auth/bluesky", { method: "DELETE" });
}

export async function startMastodonOAuth(instanceUrl: string) {
  return fetchJson<{ ok: boolean; authorizeUrl: string }>(
    "/api/auth/mastodon/start",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instanceUrl }),
    }
  );
}

export async function disconnectMastodon() {
  return fetchJson("/api/auth/mastodon", { method: "DELETE" });
}

export async function configureXList(listUrl: string) {
  return fetchJson("/api/auth/x", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ listUrl }),
  });
}

export async function disconnectX() {
  return fetchJson("/api/auth/x", { method: "DELETE" });
}

export async function fetchStatus() {
  return fetchJson<PlatformStatuses>("/api/status");
}
