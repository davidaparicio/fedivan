import { useEffect, useRef, useState } from "react";

interface Props {
  listUrl: string;
}

export default function XColumn({ listUrl }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    setFallback(false);
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = "";

    const anchor = document.createElement("a");
    anchor.className = "twitter-timeline";
    anchor.setAttribute("data-theme", "light");
    anchor.setAttribute("data-chrome", "noheader nofooter noborders");
    anchor.href = listUrl;
    anchor.textContent = "Loading X List…";
    container.appendChild(anchor);

    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    container.appendChild(script);

    const timeout = setTimeout(() => {
      const iframe = container.querySelector("iframe");
      if (!iframe) setFallback(true);
    }, 6000);

    return () => {
      clearTimeout(timeout);
      container.innerHTML = "";
    };
  }, [listUrl]);

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 p-3 border-b border-gray-200 dark:border-gray-700">
        <h2 className="font-bold text-sm dark:text-gray-100">X — List</h2>
        <p className="text-[10px] text-gray-400 mt-0.5">
          Public posts from your List, not your Following timeline.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {fallback ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              X embed unavailable — this is common for logged-out browsers
              since 2023.
            </p>
            <a
              href={listUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Open List on x.com →
            </a>
          </div>
        ) : (
          <div ref={containerRef} />
        )}
      </div>
    </div>
  );
}
