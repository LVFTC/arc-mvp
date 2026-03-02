import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { BigFiveResults } from "@/components/BigFiveResults";
import { IKIGAI_ZONES } from "@shared/questionBank";
import {
  CheckCircle2,
  FileText,
  RefreshCw,
  Target,
  Brain,
  Heart,
  BarChart2,
  Clock,
  AlertCircle,
  Download,
  Loader2,
  WifiOff,
} from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";

interface SubmittedProps {
  onRestart?: () => void;
}

export default function Submitted({ onRestart }: SubmittedProps) {
  const { data: status, isLoading: statusLoading } = trpc.assessment.status.useQuery();
  const { data: assessment, isLoading: assessmentLoading } = trpc.assessment.getFull.useQuery();
  const { data: plan } = trpc.plan90d.get.useQuery();
  const [pdfGenerating, setPdfGenerating] = useState(false);

  // ── PDF health: poll a cada 15s; não travar na primeira falha ────────────
  const { data: pdfHealth, isLoading: healthLoading, refetch: refetchHealth } =
    trpc.report.health.useQuery(undefined, {
      refetchInterval: 15_000,
      refetchOnWindowFocus: true,
      retry: 2,
      retryDelay: 1000,
    });

  const pdfUnavailableReason =
    pdfHealth && !pdfHealth.ok ? pdfHealth.reason : null;
  // ─────────────────────────────────────────────────────────────────────────

  // ── Download Safari-safe ──────────────────────────────────────────────────
  // triggerDownload é chamado dentro de onSuccess (que já está no contexto
  // do user gesture original via mutate() → Safari aceita Blob URLs >= 15.4)
  const triggerDownload = useCallback((base64: string, filename: string) => {
    try {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      // Criar <a> no DOM, clicar e remover imediatamente (Safari-compatible)
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.rel = "noopener";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      // Fallback: abrir em nova aba (sempre funciona em user gesture)
      window.open(`data:application/pdf;base64,${base64}`, "_blank", "noopener");
    }
  }, []);

  const generatePdf = trpc.report.generate.useMutation({
    onSuccess: (data) => {
      setPdfGenerating(false);
      triggerDownload(data.pdfBase64, data.filename);
      toast.success("PDF gerado com sucesso!");
    },
    onError: (err) => {
      setPdfGenerating(false);
      refetchHealth();
      toast.error(err.message ?? "PDF indisponível no momento. Tente novamente em instantes.");
    },
  });

  const isLoading = statusLoading || assessmentLoading;

  const bigFiveAnswers: Record<string, number> = {};
  assessment?.likert?.forEach(r => { bigFiveAnswers[r.itemId] = r.value; });

  // TS FIX 3: choices vem de assessment.choices, não de status.choices
  const chosenZone = assessment?.choices?.chosenZone;
  const zoneInfo = chosenZone ? IKIGAI_ZONES.find(z => z.key === chosenZone) : null;

  const completedAt = assessment?.choices?.completedAt
    ? new Date(assessment.choices.completedAt).toLocaleDateString("pt-BR", {
        day: "2-digit", month: "long", year: "numeric"
      })
    : null;

  // TS FIX 2: ikigai status usa circles[], não answered/total diretamente
  // Calculamos answered/total a partir dos circles quando disponível
  const ikigaiStatus = status?.sections?.ikigai as
    | { complete: boolean; circles?: Array<{ key: string; count: number; min: number }> }
    | undefined;
  const ikigaiAnswered = ikigaiStatus?.circles
    ? ikigaiStatus.circles.filter(c => c.count >= c.min).length
    : undefined;
  const ikigaiTotal = ikigaiStatus?.circles?.length;

  const sectionList = [
    {
      key: "core_likert",
      label: "Agilidades CORE",
      icon: <BarChart2 className="w-4 h-4" />,
      complete: status?.sections?.core_likert?.complete,
      detail: (status?.sections?.core_likert as { answered?: number; total?: number } | undefined)?.answered !== undefined
        ? `${(status!.sections!.core_likert as { answered: number; total: number }).answered}/${(status!.sections!.core_likert as { answered: number; total: number }).total} itens`
        : null,
    },
    {
      key: "core_evidence",
      label: "Evidências",
      icon: <FileText className="w-4 h-4" />,
      complete: status?.sections?.core_evidence?.complete,
      detail: (status?.sections?.core_evidence as { answered?: number; total?: number } | undefined)?.answered !== undefined
        ? `${(status!.sections!.core_evidence as { answered: number; total: number }).answered}/${(status!.sections!.core_evidence as { answered: number; total: number }).total} itens`
        : null,
    },
    {
      key: "bigfive",
      label: "Big Five",
      icon: <Brain className="w-4 h-4" />,
      complete: status?.sections?.bigfive?.complete,
      detail: (status?.sections?.bigfive as { answered?: number; total?: number } | undefined)?.answered !== undefined
        ? `${(status!.sections!.bigfive as { answered: number; total: number }).answered}/${(status!.sections!.bigfive as { answered: number; total: number }).total} itens`
        : null,
    },
    {
      key: "ikigai",
      label: "IKIGAI",
      icon: <Heart className="w-4 h-4" />,
      complete: ikigaiStatus?.complete,
      // TS FIX 2: usar dados calculados dos circles
      detail: ikigaiAnswered !== undefined && ikigaiTotal !== undefined
        ? `${ikigaiAnswered}/${ikigaiTotal} círculos`
        : null,
    },
    {
      key: "choices",
      label: "Zona & Hipótese",
      icon: <Target className="w-4 h-4" />,
      // TS FIX 3: choices não está em status.sections — inferir de assessment.choices
      complete: !!chosenZone,
      detail: chosenZone ?? null,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Botão desabilitado se: gerando, assessment incompleto, ou health ainda carregando
  // NÃO desabilitar só por pdfServiceOk=false — gerar já tenta warmup antes de falhar
  const buttonDisabled = pdfGenerating || !status?.allComplete || healthLoading;

  return (
    <div className="space-y-5 max-w-2xl mx-auto px-4 py-6">

      {/* Hero */}
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-green-500" />
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Avaliação concluída</h1>
        {completedAt && (
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {completedAt}
          </p>
        )}
      </div>

      {/* Status das seções */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Status das seções</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sectionList.map(s => (
            <div key={s.key} className="flex items-center gap-3">
              <span className={`flex-shrink-0 ${s.complete ? "text-green-500" : "text-amber-400"}`}>
                {s.complete ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              </span>
              <span className="text-muted-foreground">{s.icon}</span>
              <span className="text-sm font-medium flex-1">{s.label}</span>
              {s.detail && (
                <span className="text-xs text-muted-foreground">{s.detail}</span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Zona escolhida */}
      {zoneInfo && (
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
              Zona escolhida
            </p>
            <p className="text-sm font-bold">{zoneInfo.label}</p>
            {"description" in zoneInfo && zoneInfo.description && (
              <p className="text-xs text-muted-foreground mt-1">{String(zoneInfo.description)}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Big Five */}
      {Object.keys(bigFiveAnswers).length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              Traços Big Five
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BigFiveResults answers={bigFiveAnswers} />
          </CardContent>
        </Card>
      )}

      {/* Plano 90D preview */}
      {plan && (plan.selected70 || plan.selected20 || plan.selected10) && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Mini Plano 90 Dias — resumo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { key: "70", label: "70% — Trabalho principal", items: plan.selected70 as string[] | null },
              { key: "20", label: "20% — Desenvolvimento", items: plan.selected20 as string[] | null },
              { key: "10", label: "10% — Exploração", items: plan.selected10 as string[] | null },
            ].map(block => (
              <div key={block.key} className="flex items-start gap-2">
                <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0 mt-0.5">
                  {block.key}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {block.items && block.items.length > 0
                    ? `${block.items.length} hipótese${block.items.length > 1 ? "s" : ""} selecionada${block.items.length > 1 ? "s" : ""}`
                    : "Não preenchido"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* PDF CTA */}
      <Card className="border border-primary/30 shadow-sm bg-primary/3">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Relatório PDF personalizado</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Radar de Agilidades, Big Five, mapa IKIGAI e Plano 90 dias.
              </p>

              {/* Aviso de indisponibilidade — sem URL interna */}
              {!healthLoading && pdfUnavailableReason && (
                <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                  <WifiOff className="w-3 h-3 flex-shrink-0" />
                  {pdfUnavailableReason}
                </p>
              )}
            </div>

            <Button
              variant="default"
              size="sm"
              className="gap-1.5 shrink-0"
              disabled={buttonDisabled}
              onClick={() => {
                setPdfGenerating(true);
                generatePdf.mutate();
              }}
            >
              {pdfGenerating ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Gerando...</>
              ) : healthLoading ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Aguarde...</>
              ) : (
                <><Download className="w-3.5 h-3.5" /> Baixar PDF</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Restart */}
      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRestart ? onRestart() : window.location.href = '/'}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reiniciar avaliação
        </Button>
      </div>
    </div>
  );
}
