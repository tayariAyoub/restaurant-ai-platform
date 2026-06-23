import { Check, Circle } from "lucide-react";

import type { SetupChecklist } from "@/lib/types";

const labels: Record<keyof SetupChecklist, string> = {
  information: "Restaurant information",
  opening_hours: "Opening hours",
  branding: "Logo & photos",
  menu: "Menu",
  design: "Website design",
  chatbot: "AI knowledge",
};

export default function SetupProgress({
  checklist,
  percent,
  compact = false,
}: {
  checklist: SetupChecklist;
  percent: number;
  compact?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold">Setup progress</span>
        <span className="font-bold text-orange-600">{percent}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${percent}%` }} />
      </div>
      {!compact && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {(Object.entries(checklist) as [keyof SetupChecklist, boolean][]).map(([key, complete]) => (
            <div key={key} className={`flex items-center gap-2 text-sm ${complete ? "text-slate-700" : "text-slate-400"}`}>
              {complete ? <span className="rounded-full bg-green-100 p-1 text-green-700"><Check size={12} /></span> : <Circle size={20} />}
              {labels[key]}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
