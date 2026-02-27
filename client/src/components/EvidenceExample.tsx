import { useState } from "react";
import { ChevronDown, ChevronUp, Lightbulb } from "lucide-react";

interface EvidenceExampleProps {
  dimensionLabel: string;
  example: {
    situation: string;
    action: string;
    impact: string;
  };
}

export function EvidenceExample({ dimensionLabel, example }: EvidenceExampleProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left gap-2 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
            Ver exemplo de resposta boa
          </span>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-amber-500 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-amber-500 shrink-0" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-amber-200 dark:border-amber-900/40 pt-3">
          <p className="text-xs text-amber-700 dark:text-amber-400 font-medium uppercase tracking-wide">
            Estrutura: Situação → Ação → Impacto
          </p>

          <div className="space-y-2">
            <div className="flex gap-3">
              <span className="shrink-0 w-20 text-xs font-semibold text-amber-600 dark:text-amber-400 pt-0.5">
                Situação
              </span>
              <p className="text-sm text-foreground leading-relaxed">
                {example.situation}
              </p>
            </div>
            <div className="flex gap-3">
              <span className="shrink-0 w-20 text-xs font-semibold text-amber-600 dark:text-amber-400 pt-0.5">
                Ação
              </span>
              <p className="text-sm text-foreground leading-relaxed">
                {example.action}
              </p>
            </div>
            <div className="flex gap-3">
              <span className="shrink-0 w-20 text-xs font-semibold text-amber-600 dark:text-amber-400 pt-0.5">
                Impacto
              </span>
              <p className="text-sm text-foreground leading-relaxed">
                {example.impact}
              </p>
            </div>
          </div>

          <p className="text-xs text-amber-600 dark:text-amber-500 italic">
            Escreva com o mesmo nível de detalhe — contexto, o que você fez e o resultado concreto.
          </p>
        </div>
      )}
    </div>
  );
}
