import { Router } from "express";
import type {
  Post,
  PlatformStatuses,
  ConnectionStatus,
  XConnectionStatus,
  TimelineResponse,
} from "fedivan-shared";
import { fetchBlueskyTimeline, isBlueskyConnected } from "../platforms/bluesky.js";
import { fetchMastodonTimeline, isMastodonConnected } from "../platforms/mastodon.js";
import { getAccount } from "../db.js";

const router = Router();

interface CacheEntry {
  posts: Post[];
  ts: number;
}

const cache: Record<string, CacheEntry> = {};
const CACHE_TTL = 60_000;

function getCached(platform: string): Post[] | null {
  const entry = cache[platform];
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.posts;
  return null;
}

router.get("/timeline", async (_req, res) => {
  const errors: Partial<Record<string, string>> = {};
  let bskyStatus: ConnectionStatus = "not_connected";
  let mastoStatus: ConnectionStatus = "not_connected";

  let bskyPosts: Post[] = [];
  let mastoPosts: Post[] = [];

  const fetches: Promise<void>[] = [];

  if (isBlueskyConnected() || getAccount("bluesky")) {
    bskyStatus = "connected";
    fetches.push(
      (async () => {
        const cached = getCached("bluesky");
        if (cached) {
          bskyPosts = cached;
          return;
        }
        try {
          bskyPosts = await fetchBlueskyTimeline();
          cache.bluesky = { posts: bskyPosts, ts: Date.now() };
        } catch (e: any) {
          bskyStatus = "error";
          errors.bluesky = e.message || "Failed to fetch Bluesky timeline";
          const fallback = getCached("bluesky");
          if (fallback) bskyPosts = fallback;
        }
      })()
    );
  }

  if (isMastodonConnected()) {
    mastoStatus = "connected";
    fetches.push(
      (async () => {
        const cached = getCached("mastodon");
        if (cached) {
          mastoPosts = cached;
          return;
        }
        try {
          mastoPosts = await fetchMastodonTimeline();
          cache.mastodon = { posts: mastoPosts, ts: Date.now() };
        } catch (e: any) {
          if (e.message?.includes("429")) {
            mastoStatus = "rate_limited";
          } else {
            mastoStatus = "error";
          }
          errors.mastodon = e.message || "Failed to fetch Mastodon timeline";
          const fallback = getCached("mastodon");
          if (fallback) mastoPosts = fallback;
        }
      })()
    );
  }

  await Promise.allSettled(fetches);

  const posts = [...bskyPosts, ...mastoPosts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const xAcct = getAccount("x");
  const xStatus: XConnectionStatus = xAcct ? "configured" : "not_configured";

  const statuses: PlatformStatuses = {
    bluesky: bskyStatus,
    mastodon: mastoStatus,
    x: xStatus,
    xListUrl: xAcct?.credentials.listUrl,
  };

  const body: TimelineResponse = { posts, statuses, errors };
  res.json(body);
});

router.get("/status", (_req, res) => {
  const xAcct = getAccount("x");
  const statuses: PlatformStatuses = {
    bluesky: isBlueskyConnected() || getAccount("bluesky") ? "connected" : "not_connected",
    mastodon: isMastodonConnected() ? "connected" : "not_connected",
    x: xAcct ? "configured" : "not_configured",
    xListUrl: xAcct?.credentials.listUrl,
  };
  res.json(statuses);
});

export default router;
