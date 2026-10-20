import { useMemo, useState } from "react";
import type { Post, Platform } from "fedivan-shared";
import PostCard from "./PostCard";

interface Props {
  posts: Post[];
  errors: Partial<Record<string, string>>;
}

export default function MergedColumn({ posts, errors }: Props) {
  const [showBluesky, setShowBluesky] = useState(true);
  const [showMastodon, setShowMastodon] = useState(true);
  const [keyword, setKeyword] = useState("");

  const filtered = useMemo(() => {
    let result = posts.filter((p) => {
      if (p.platform === "bluesky" && !showBluesky) return false;
      if (p.platform === "mastodon" && !showMastodon) return false;
      return true;
    });
    if (keyword.trim()) {
      const kw = keyword.toLowerCase();
      result = result.filter(
        (p) =>
          p.text.toLowerCase().includes(kw) ||
          p.author.toLowerCase().includes(kw) ||
          p.handle.toLowerCase().includes(kw)
      );
    }
    return result;
  }, [posts, showBluesky, showMastodon, keyword]);

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 p-3 border-b border-gray-200 dark:border-gray-700">
        <h2 className="font-bold text-sm mb-2 dark:text-gray-100">
          Merged Timeline
        </h2>
        <div className="flex gap-2 items-center flex-wrap">
          <ToggleChip
            label="Bluesky"
            active={showBluesky}
            color="bg-blue-500"
            onClick={() => setShowBluesky(!showBluesky)}
          />
          <ToggleChip
            label="Mastodon"
            active={showMastodon}
            color="bg-purple-600"
            onClick={() => setShowMastodon(!showMastodon)}
          />
          <input
            type="text"
            placeholder="Search…"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="ml-auto text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 w-28 bg-transparent dark:text-gray-200"
          />
        </div>
      </div>

      {Object.entries(errors).map(([platform, msg]) => (
        <div
          key={platform}
          className="mx-3 mt-2 text-xs bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded p-2"
        >
          {platform}: {msg}
        </div>
      ))}

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filtered.length === 0 && (
          <p className="text-sm text-gray-400 text-center mt-8">
            No posts to show. Connect a platform to get started.
          </p>
        )}
        {filtered.map((post) => (
          <PostCard key={`${post.platform}-${post.id}`} post={post} />
        ))}
      </div>
    </div>
  );
}

function ToggleChip({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-2.5 py-1 rounded-full transition-all ${
        active
          ? `${color} text-white`
          : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
      }`}
    >
      {label}
    </button>
  );
}
