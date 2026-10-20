import type { Post, MediaItem, LinkPreview } from "fedivan-shared";
import { getAccount, upsertAccount } from "../db.js";

export function isMastodonConnected(): boolean {
  const acct = getAccount("mastodon");
  return acct !== null && !!acct.credentials.accessToken;
}

export async function startMastodonOAuth(
  instanceUrl: string,
  callbackUrl: string
): Promise<string> {
  const base = instanceUrl.replace(/\/+$/, "");

  const appRes = await fetch(`${base}/api/v1/apps`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_name: "Fedivan",
      redirect_uris: callbackUrl,
      scopes: "read",
      website: "https://github.com/davidaparicio/fedivan",
    }),
  });
  if (!appRes.ok) throw new Error(`Failed to register app: ${appRes.status}`);
  const app = await appRes.json();

  upsertAccount("mastodon", {
    instanceUrl: base,
    clientId: app.client_id,
    clientSecret: app.client_secret,
    redirectUri: callbackUrl,
    accessToken: null,
  });

  const params = new URLSearchParams({
    client_id: app.client_id,
    scope: "read",
    redirect_uri: callbackUrl,
    response_type: "code",
  });
  return `${base}/oauth/authorize?${params}`;
}

export async function completeMastodonOAuth(code: string): Promise<void> {
  const acct = getAccount("mastodon");
  if (!acct) throw new Error("No Mastodon account in progress");
  const { instanceUrl, clientId, clientSecret, redirectUri } = acct.credentials;

  const tokenRes = await fetch(`${instanceUrl}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code,
      scope: "read",
    }),
  });
  if (!tokenRes.ok) throw new Error(`Token exchange failed: ${tokenRes.status}`);
  const token = await tokenRes.json();

  upsertAccount(
    "mastodon",
    { ...acct.credentials, accessToken: token.access_token },
    acct.meta
  );
}

export async function fetchMastodonTimeline(): Promise<Post[]> {
  const acct = getAccount("mastodon");
  if (!acct || !acct.credentials.accessToken) return [];
  const { instanceUrl, accessToken } = acct.credentials;

  const res = await fetch(`${instanceUrl}/api/v1/timelines/home?limit=40`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Mastodon timeline failed: ${res.status}`);
  const statuses: any[] = await res.json();
  return statuses.map((s) => normalizeStatus(s, instanceUrl));
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function normalizeStatus(status: any, instanceUrl: string): Post {
  const s = status.reblog || status;

  const media: MediaItem[] = (s.media_attachments || [])
    .filter((a: any) => a.type === "image" || a.type === "video" || a.type === "gifv")
    .map((a: any) => ({
      type: a.type === "image" ? ("image" as const) : ("video" as const),
      url: a.url,
      alt: a.description || undefined,
      thumbUrl: a.preview_url || undefined,
    }));

  let link: LinkPreview | undefined;
  if (s.card) {
    link = {
      url: s.card.url,
      title: s.card.title || undefined,
      description: s.card.description || undefined,
      image: s.card.image || undefined,
    };
  }

  return {
    id: s.id,
    platform: "mastodon",
    author: s.account.display_name || s.account.username,
    avatar: s.account.avatar,
    handle: `@${s.account.acct}`,
    text: stripHtml(s.content || ""),
    media,
    link,
    createdAt: s.created_at,
    url: s.url || `${instanceUrl}/web/@${s.account.acct}/${s.id}`,
    likeCount: s.favourites_count ?? 0,
    repostCount: s.reblogs_count ?? 0,
    replyCount: s.replies_count ?? 0,
  };
}

export function disconnectMastodon() {
  // just wipes stored credentials
}
