export type Platform = "bluesky" | "mastodon" | "x";

export interface Post {
  id: string;
  platform: Platform;
  author: string;
  avatar: string;
  handle: string;
  text: string;
  media: MediaItem[];
  link?: LinkPreview;
  createdAt: string;
  url: string;
  likeCount: number;
  repostCount: number;
  replyCount: number;
}

export interface MediaItem {
  type: "image" | "video";
  url: string;
  alt?: string;
  thumbUrl?: string;
}

export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
}

export type ConnectionStatus =
  | "connected"
  | "not_connected"
  | "error"
  | "rate_limited";

export type XConnectionStatus = "configured" | "not_configured";

export interface PlatformStatuses {
  bluesky: ConnectionStatus;
  mastodon: ConnectionStatus;
  x: XConnectionStatus;
  xListUrl?: string;
}

export interface TimelineResponse {
  posts: Post[];
  statuses: PlatformStatuses;
  errors: Partial<Record<Platform, string>>;
}
