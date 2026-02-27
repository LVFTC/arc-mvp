import { useState } from "react";
import { ChevronDown, ChevronUp, Brain } from "lucide-react";

export interface ArcTeachesContent {
  why: string;
  trap: string;
  howTo: string[];
}

interface ArcTeachesProps {
  content: ArcTeachesContent;
  defaultOpen?: boolean;
}

export function ArcTeaches({ content, defaultOpen = false }: ArcTeachesProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left gap-2 hover:bg-primary/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-semibold text-primary">
            ARC ensina a pensar
          </span>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-primary shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-primary shrink-0" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-primary/20 pt-3">
          {/* Por que estamos perguntando */}
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
              Por que estamos perguntando isso
            </p>
            <p className="text-sm text-foreground leading-relaxed">{content.why}</p>
          </div>

          {/* Armadilha comum */}
          <div className="flex gap-3 p-3 rounded-md bg-destructive/5 border border-destructive/20">
            <span className="text-base shrink-0">⚠️</span>
            <div>
              <p className="text-xs font-semibold text-destructive mb-1">Armadilha comum</p>
              <p className="text-sm text-foreground leading-relaxed">{content.trap}</p>
            </div>
          </div>

          {/* Como responder melhor */}
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
              Como responder melhor
            </p>
            <ul className="space-y-1.5">
              {content.howTo.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground leading-relaxed">
                  <span className="text-primary font-bold shrink-0 mt-0.5">→</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
