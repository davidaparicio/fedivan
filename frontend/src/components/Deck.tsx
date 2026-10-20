import { useEffect, useState } from "react";
import type { TimelineResponse } from "fedivan-shared";
import MergedColumn from "./MergedColumn";
import XColumn from "./XColumn";

type ColumnId = "merged" | "x";

interface ColumnDef {
  id: ColumnId;
  label: string;
}

const ALL_COLUMNS: ColumnDef[] = [
  { id: "merged", label: "Merged Timeline" },
  { id: "x", label: "X — List" },
];

const STORAGE_KEY = "fedivan-columns";

function loadColumns(): ColumnId[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return ["merged", "x"];
}

function saveColumns(cols: ColumnId[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cols));
  } catch {}
}

interface Props {
  data: TimelineResponse;
}

export default function Deck({ data }: Props) {
  const [columns, setColumns] = useState<ColumnId[]>(loadColumns);

  useEffect(() => {
    saveColumns(columns);
  }, [columns]);

  const hidden = ALL_COLUMNS.filter((c) => !columns.includes(c.id));

  function moveColumn(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= columns.length) return;
    const next = [...columns];
    [next[index], next[target]] = [next[target], next[index]];
    setColumns(next);
  }

  function removeColumn(id: ColumnId) {
    setColumns(columns.filter((c) => c !== id));
  }

  function addColumn(id: ColumnId) {
    setColumns([...columns, id]);
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {hidden.length > 0 && (
        <div className="shrink-0 px-4 py-2 flex gap-2 items-center border-b border-gray-200 dark:border-gray-700">
          <span className="text-xs text-gray-400">Add column:</span>
          {hidden.map((c) => (
            <button
              key={c.id}
              onClick={() => addColumn(c.id)}
              className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-300"
            >
              + {c.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 flex overflow-x-auto snap-x snap-mandatory md:snap-none">
        {columns.map((colId, i) => (
          <div
            key={colId}
            className="shrink-0 w-[100vw] md:w-[380px] h-full border-r border-gray-200 dark:border-gray-700 flex flex-col snap-center"
          >
            <div className="shrink-0 flex items-center justify-between px-3 py-1 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <div className="flex gap-1">
                <button
                  onClick={() => moveColumn(i, -1)}
                  disabled={i === 0}
                  className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  ←
                </button>
                <button
                  onClick={() => moveColumn(i, 1)}
                  disabled={i === columns.length - 1}
                  className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  →
                </button>
              </div>
              <button
                onClick={() => removeColumn(colId)}
                className="text-xs text-gray-400 hover:text-red-500"
                title="Remove column"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              {colId === "merged" && (
                <MergedColumn posts={data.posts} errors={data.errors} />
              )}
              {colId === "x" &&
                (data.statuses.xListUrl ? (
                  <XColumn listUrl={data.statuses.xListUrl} />
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-gray-400 p-6 text-center">
                    No X List configured. Open settings to add one.
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
