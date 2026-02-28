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
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface SubmittedProps {
  onRestart?: () => void;
}

export default function Submitted({ onRestart }: SubmittedProps) {
  const { data: status, isLoading: statusLoading } = trpc.assessment.status.useQuery();
  const { data: assessment, isLoading: assessmentLoading } = trpc.assessment.getFull.useQuery();
  const { data: plan } = trpc.plan90d.get.useQuery();
  const [pdfGenerating, setPdfGenerating] = useState(false);

  const generatePdf = trpc.report.generate.useMutation({
    onSuccess: (data) => {
      // Decode base64 and trigger download
      const bytes = Uint8Array.from(atob(data.pdfBase64), c => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Relatório PDF gerado com sucesso!");
      setPdfGenerating(false);
    },
    onError: (err) => {
      toast.error(`Erro ao gerar PDF: ${err.message}`);
      setPdfGenerating(false);
    },
  });

  const isLoading = statusLoading || assessmentLoading;

  // Build Big Five answers map
  const bigFiveAnswers: Record<string, number> = {};
  assessment?.likert?.forEach(r => { bigFiveAnswers[r.itemId] = r.value; });

  const chosenZone = assessment?.choices?.chosenZone;
  const zoneInfo = chosenZone ? IKIGAI_ZONES.find(z => z.key === chosenZone) : null;

  const completedAt = assessment?.choices?.completedAt
    ? new Date(assessment.choices.completedAt).toLocaleDateString("pt-BR", {
        day: "2-digit", month: "long", year: "numeric"
      })
    : null;

  const sectionList = [
    {
      key: "core_likert",
      label: "Agilidades CORE",
      icon: <BarChart2 className="w-4 h-4" />,
      complete: status?.sections?.core_likert?.complete,
      detail: status?.sections?.core_likert
        ? `${status.sections.core_likert.answered}/${status.sections.core_likert.total} itens`
        : null,
    },
    {
      key: "core_evidence",
      label: "Evidências",
      icon: <FileText className="w-4 h-4" />,
      complete: status?.sections?.core_evidence?.complete,
      detail: status?.sections?.core_evidence
        ? `${status.sections.core_evidence.answered}/${status.sections.core_evidence.total} respostas`
        : null,
    },
    {
      key: "bigfive",
      label: "Big Five",
      icon: <Brain className="w-4 h-4" />,
      complete: status?.sections?.bigfive?.complete,
      detail: status?.sections?.bigfive
        ? `${status.sections.bigfive.answered}/${status.sections.bigfive.total} itens`
        : null,
    },
    {
      key: "ikigai",
      label: "IKIGAI",
      icon: <Heart className="w-4 h-4" />,
      complete: status?.sections?.ikigai?.complete,
      detail: status?.sections?.ikigai?.circles
        ? `${status.sections.ikigai.circles.reduce((a: number, c: { count: number }) => a + c.count, 0)} itens`
        : null,
    },
    {
      key: "zone",
      label: "Zona IKIGAI",
      icon: <Target className="w-4 h-4" />,
      complete: status?.sections?.zone?.complete,
      detail: zoneInfo?.label || null,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-muted-foreground">Carregando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground">Avaliação concluída</h2>
              {completedAt && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Submetida em {completedAt}
                </p>
              )}
              {plan?.cycleObjective && (
                <div className="mt-2 p-2.5 rounded-md bg-primary/10 border border-primary/20">
                  <p className="text-xs font-medium text-primary">Objetivo do ciclo</p>
                  <p className="text-sm text-foreground mt-0.5">{plan.cycleObjective}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status das seções */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Status das seções</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sectionList.map(section => (
              <div key={section.key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  <span className={section.complete ? "text-green-600" : "text-amber-500"}>
                    {section.icon}
                  </span>
                  <span className="text-sm font-medium">{section.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {section.detail && (
                    <span className="text-xs text-muted-foreground">{section.detail}</span>
                  )}
                  {section.complete ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Zona IKIGAI */}
      {zoneInfo && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Zona IKIGAI escolhida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
              <p className="text-lg font-bold text-primary">{zoneInfo.label}</p>
              <p className="text-sm text-muted-foreground mt-1">{zoneInfo.description}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Big Five preview */}
      {Object.keys(bigFiveAnswers).length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              Perfil Big Five — visão geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BigFiveResults answers={bigFiveAnswers} compact />
            <p className="text-xs text-muted-foreground mt-3 italic">
              O relatório PDF incluirá análise completa com contextos que favorecem e drenam por traço.
            </p>
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
            </div>
            <Button
              variant="default"
              size="sm"
              className="gap-1.5 shrink-0"
              disabled={pdfGenerating || !status?.allComplete}
              onClick={() => {
                setPdfGenerating(true);
                generatePdf.mutate();
              }}
            >
              {pdfGenerating ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Gerando...</>
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
