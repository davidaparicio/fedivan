import { useState } from "react";
import type { Post } from "fedivan-shared";

const TRUNCATE_LEN = 500;

const platformColors: Record<string, string> = {
  bluesky: "bg-blue-500",
  mastodon: "bg-purple-600",
};

const platformLabels: Record<string, string> = {
  bluesky: "BSky",
  mastodon: "Masto",
};

export default function PostCard({ post }: { post: Post }) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncate = post.text.length > TRUNCATE_LEN;
  const displayText =
    needsTruncate && !expanded
      ? post.text.slice(0, TRUNCATE_LEN) + "…"
      : post.text;

  return (
    <a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
    >
      <div className="flex items-start gap-3">
        <img
          src={post.avatar}
          alt={post.author}
          className="w-10 h-10 rounded-full shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm truncate dark:text-gray-100">
              {post.author}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {post.handle}
            </span>
            <span
              className={`text-[10px] text-white px-1.5 py-0.5 rounded-full ${platformColors[post.platform]}`}
            >
              {platformLabels[post.platform]}
            </span>
          </div>

          <p className="mt-1 text-sm whitespace-pre-wrap break-words dark:text-gray-200">
            {displayText}
          </p>
          {needsTruncate && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="text-xs text-blue-500 mt-1 hover:underline"
            >
              {expanded ? "show less" : "show more"}
            </button>
          )}

          {post.media.length > 0 && (
            <div
              className={`mt-2 grid gap-1 ${post.media.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
            >
              {post.media.map((m, i) => (
                <img
                  key={i}
                  src={m.thumbUrl || m.url}
                  alt={m.alt || ""}
                  className="rounded-md w-full object-cover max-h-48"
                />
              ))}
            </div>
          )}

          {post.link && (
            <div className="mt-2 border border-gray-200 dark:border-gray-600 rounded-md p-2 text-xs">
              {post.link.image && (
                <img
                  src={post.link.image}
                  alt=""
                  className="rounded mb-1 w-full object-cover max-h-32"
                />
              )}
              {post.link.title && (
                <div className="font-medium dark:text-gray-200">
                  {post.link.title}
                </div>
              )}
              {post.link.description && (
                <div className="text-gray-500 dark:text-gray-400 line-clamp-2">
                  {post.link.description}
                </div>
              )}
            </div>
          )}

          <div className="mt-2 flex gap-4 text-xs text-gray-400">
            <span>♥ {post.likeCount}</span>
            <span>⟳ {post.repostCount}</span>
            <span>💬 {post.replyCount}</span>
            <span className="ml-auto">
              {new Date(post.createdAt).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
