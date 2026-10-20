import { useState } from "react";
import { useTimeline } from "./api";
import Deck from "./components/Deck";
import ConnectPanel from "./components/ConnectPanel";
import type { PlatformStatuses } from "fedivan-shared";

export default function App() {
  const { data, loading, refresh } = useTimeline();
  const [showConnect, setShowConnect] = useState(false);

  const statuses: PlatformStatuses = data?.statuses ?? {
    bluesky: "not_connected",
    mastodon: "not_connected",
    x: "not_configured",
  };

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <header className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-lg font-bold tracking-tight">Fedivan</h1>

        <div className="flex items-center gap-3">
          <StatusPill
            label="Bluesky"
            status={statuses.bluesky}
          />
          <StatusPill
            label="Mastodon"
            status={statuses.mastodon}
          />
          <StatusPill
            label="X"
            status={statuses.x === "configured" ? "connected" : "not_connected"}
            displayStatus={statuses.x === "configured" ? "configured" : "not configured"}
          />
          <button
            onClick={() => setShowConnect(true)}
            className="text-xs bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            Settings
          </button>
        </div>
      </header>

      {loading && !data ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400 animate-pulse">Loading…</p>
        </div>
      ) : data ? (
        <Deck data={data} />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400">
            Could not load timeline.{" "}
            <button onClick={refresh} className="text-blue-500 hover:underline">
              Retry
            </button>
          </p>
        </div>
      )}

      {showConnect && (
        <ConnectPanel
          statuses={statuses}
          onDone={() => {
            setShowConnect(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function StatusPill({
  label,
  status,
  displayStatus,
}: {
  label: string;
  status: string;
  displayStatus?: string;
}) {
  const dotColors: Record<string, string> = {
    connected: "bg-green-500",
    not_connected: "bg-gray-400",
    error: "bg-red-500",
    rate_limited: "bg-yellow-500",
  };

  return (
    <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
      <span
        className={`w-2 h-2 rounded-full ${dotColors[status] || dotColors.not_connected}`}
      />
      {label}
      {displayStatus && (
        <span className="text-[10px]">({displayStatus})</span>
      )}
    </div>
  );
}
