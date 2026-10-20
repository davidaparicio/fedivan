import { AtpAgent } from "@atproto/api";
import type { Post, MediaItem, LinkPreview } from "fedivan-shared";
import { getAccount, upsertAccount } from "../db.js";

let agent: AtpAgent | null = null;

export async function loginBluesky(identifier: string, appPassword: string) {
  const a = new AtpAgent({ service: "https://bsky.social" });
  const res = await a.login({ identifier, password: appPassword });
  upsertAccount("bluesky", {
    identifier,
    appPassword,
    service: "https://bsky.social",
    did: res.data.did,
    handle: res.data.handle,
  });
  agent = a;
  return { handle: res.data.handle, did: res.data.did };
}

export async function resumeBluesky(): Promise<boolean> {
  const acct = getAccount("bluesky");
  if (!acct) return false;
  try {
    const a = new AtpAgent({ service: acct.credentials.service });
    await a.login({
      identifier: acct.credentials.identifier,
      password: acct.credentials.appPassword,
    });
    agent = a;
    return true;
  } catch {
    return false;
  }
}

export function isBlueskyConnected(): boolean {
  return agent !== null && agent.session !== undefined;
}

export async function fetchBlueskyTimeline(): Promise<Post[]> {
  if (!agent?.session) {
    if (!(await resumeBluesky())) return [];
  }
  const res = await agent!.getTimeline({ limit: 50 });
  return res.data.feed.map((item) => normalizePost(item));
}

function normalizePost(item: any): Post {
  const post = item.post;
  const record = post.record as any;
  const author = post.author;
  const rkey = post.uri.split("/").pop() || "";

  const media: MediaItem[] = [];
  let link: LinkPreview | undefined;

  if (post.embed) {
    if (post.embed.$type === "app.bsky.embed.images#view") {
      for (const img of post.embed.images || []) {
        media.push({
          type: "image",
          url: img.fullsize,
          alt: img.alt || undefined,
          thumbUrl: img.thumb,
        });
      }
    } else if (post.embed.$type === "app.bsky.embed.external#view") {
      const ext = post.embed.external;
      link = {
        url: ext.uri,
        title: ext.title || undefined,
        description: ext.description || undefined,
        image: ext.thumb || undefined,
      };
    } else if (post.embed.$type === "app.bsky.embed.recordWithMedia#view") {
      const innerMedia = post.embed.media;
      if (innerMedia?.$type === "app.bsky.embed.images#view") {
        for (const img of innerMedia.images || []) {
          media.push({
            type: "image",
            url: img.fullsize,
            alt: img.alt || undefined,
            thumbUrl: img.thumb,
          });
        }
      }
    }
  }

  return {
    id: post.cid,
    platform: "bluesky",
    author: author.displayName || author.handle,
    avatar: author.avatar || "",
    handle: `@${author.handle}`,
    text: record.text || "",
    media,
    link,
    createdAt: record.createdAt || post.indexedAt,
    url: `https://bsky.app/profile/${author.handle}/post/${rkey}`,
    likeCount: post.likeCount ?? 0,
    repostCount: post.repostCount ?? 0,
    replyCount: post.replyCount ?? 0,
  };
}

export function disconnectBluesky() {
  agent = null;
}
