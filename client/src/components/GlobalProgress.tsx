import { trpc } from "@/lib/trpc";

interface GlobalProgressProps {
  className?: string;
}

export function GlobalProgress({ className }: GlobalProgressProps) {
  const { data: status } = trpc.assessment.status.useQuery(undefined, {
    refetchInterval: false,
    staleTime: 10_000,
  });

  if (!status) return null;

  const s = status.sections;

  // Pesos por seção (total = 100)
  const weights = {
    core_likert: 30,
    core_evidence: 20,
    bigfive: 20,
    ikigai: 20,
    zone: 10,
  };

  // Progresso parcial por seção
  const coreLikertPct = s.core_likert.complete
    ? 1
    : s.core_likert.total > 0
      ? s.core_likert.answered / s.core_likert.total
      : 0;

  const coreEvidencePct = s.core_evidence.complete
    ? 1
    : s.core_evidence.total > 0
      ? s.core_evidence.answered / s.core_evidence.total
      : 0;

  const bigFivePct = s.bigfive.complete
    ? 1
    : s.bigfive.total > 0
      ? s.bigfive.answered / s.bigfive.total
      : 0;

  const ikigaiCirclesCompleted = s.ikigai.circles.filter((c) => c.count >= c.min).length;
  const ikigaiPct = s.ikigai.complete ? 1 : ikigaiCirclesCompleted / 4;

  const zonePct = s.zone.complete ? 1 : 0;

  const percentage = Math.round(
    coreLikertPct * weights.core_likert +
    coreEvidencePct * weights.core_evidence +
    bigFivePct * weights.bigfive +
    ikigaiPct * weights.ikigai +
    zonePct * weights.zone
  );

  const barColor =
    percentage >= 80
      ? "bg-green-500"
      : percentage >= 50
        ? "bg-primary"
        : "bg-primary/70";

  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-medium text-muted-foreground shrink-0 tabular-nums">
        {percentage}%
      </span>
    </div>
  );
}
