import { useState } from "react";
import type { PlatformStatuses } from "fedivan-shared";
import {
  connectBluesky,
  disconnectBluesky,
  startMastodonOAuth,
  disconnectMastodon,
  configureXList,
  disconnectX,
} from "../api";

interface Props {
  statuses: PlatformStatuses;
  onDone: () => void;
}

export default function ConnectPanel({ statuses, onDone }: Props) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold dark:text-gray-100">
            Connect Platforms
          </h2>
          <button
            onClick={onDone}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        <BlueskyForm status={statuses.bluesky} onDone={onDone} />
        <MastodonForm status={statuses.mastodon} onDone={onDone} />
        <XForm
          status={statuses.x}
          listUrl={statuses.xListUrl}
          onDone={onDone}
        />
      </div>
    </div>
  );
}

function BlueskyForm({
  status,
  onDone,
}: {
  status: string;
  onDone: () => void;
}) {
  const [identifier, setIdentifier] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const connected = status === "connected";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await connectBluesky(identifier, appPassword);
      onDone();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    await disconnectBluesky();
    onDone();
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-sm dark:text-gray-200">
          🦋 Bluesky
        </h3>
        <StatusBadge status={status} />
      </div>
      {connected ? (
        <button
          onClick={handleDisconnect}
          className="text-xs text-red-500 hover:underline"
        >
          Disconnect
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="text"
            placeholder="Handle (e.g. user.bsky.social)"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 bg-transparent dark:text-gray-200"
          />
          <input
            type="password"
            placeholder="App Password"
            value={appPassword}
            onChange={(e) => setAppPassword(e.target.value)}
            className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 bg-transparent dark:text-gray-200"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full text-sm bg-blue-500 text-white rounded py-1.5 hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Connecting…" : "Connect"}
          </button>
        </form>
      )}
    </div>
  );
}

function MastodonForm({
  status,
  onDone,
}: {
  status: string;
  onDone: () => void;
}) {
  const [instanceUrl, setInstanceUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const connected = status === "connected";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let url = instanceUrl.trim();
      if (!url.startsWith("http")) url = `https://${url}`;
      const res = await startMastodonOAuth(url);
      window.location.href = res.authorizeUrl;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    await disconnectMastodon();
    onDone();
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-sm dark:text-gray-200">
          🐘 Mastodon
        </h3>
        <StatusBadge status={status} />
      </div>
      {connected ? (
        <button
          onClick={handleDisconnect}
          className="text-xs text-red-500 hover:underline"
        >
          Disconnect
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="text"
            placeholder="Instance URL (e.g. mastodon.social)"
            value={instanceUrl}
            onChange={(e) => setInstanceUrl(e.target.value)}
            className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 bg-transparent dark:text-gray-200"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full text-sm bg-purple-600 text-white rounded py-1.5 hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? "Redirecting…" : "Connect via OAuth"}
          </button>
        </form>
      )}
    </div>
  );
}

function XForm({
  status,
  listUrl,
  onDone,
}: {
  status: string;
  listUrl?: string;
  onDone: () => void;
}) {
  const [url, setUrl] = useState(listUrl || "");
  const [error, setError] = useState("");

  const configured = status === "configured";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await configureXList(url.trim());
      onDone();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDisconnect() {
    await disconnectX();
    onDone();
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-sm dark:text-gray-200">𝕏 X (List)</h3>
        <StatusBadge
          status={configured ? "connected" : "not_connected"}
          label={configured ? "configured" : "not configured"}
        />
      </div>
      {configured ? (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {listUrl}
          </p>
          <button
            onClick={handleDisconnect}
            className="text-xs text-red-500 hover:underline"
          >
            Remove
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Paste a public X List URL. This embeds the List's public timeline —
            no API key needed.
          </p>
          <input
            type="text"
            placeholder="https://x.com/i/lists/123456"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 bg-transparent dark:text-gray-200"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            className="w-full text-sm bg-gray-900 text-white rounded py-1.5 hover:bg-gray-700"
          >
            Save List
          </button>
        </form>
      )}
    </div>
  );
}

function StatusBadge({
  status,
  label,
}: {
  status: string;
  label?: string;
}) {
  const colors: Record<string, string> = {
    connected: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
    not_connected: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
    error: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
    rate_limited: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full ${colors[status] || colors.not_connected}`}>
      {label || status.replace("_", " ")}
    </span>
  );
}
