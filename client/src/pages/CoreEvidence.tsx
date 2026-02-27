import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CORE_EVIDENCE_PROMPTS, DIMENSIONS } from "@shared/questionBank";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ArrowRight, Save, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface CoreEvidenceProps {
  onNext: () => void;
  onPrev: () => void;
}

export default function CoreEvidence({ onNext, onPrev }: CoreEvidenceProps) {
  const [dimensionIdx, setDimensionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const loadedRef = useRef(false);
  const saveMutation = trpc.evidence.save.useMutation();

  const { data: existingAnswers, isLoading } = trpc.evidence.get.useQuery();

  useEffect(() => {
    if (existingAnswers && existingAnswers.length > 0 && !loadedRef.current) {
      loadedRef.current = true;
      const loaded: Record<string, string> = {};
      existingAnswers.forEach((a) => { loaded[a.promptId] = a.text; });
      if (Object.keys(loaded).length > 0) {
        setAnswers(loaded);
      }
    }
  }, [existingAnswers]);

  const currentDimension = DIMENSIONS[dimensionIdx];
  const dimensionPrompts = CORE_EVIDENCE_PROMPTS.filter(
    (p) => p.dimension === currentDimension.key
  );

  const allAnswered = dimensionPrompts.every(
    (p) => answers[p.id] && answers[p.id].trim().length >= 10
  );

  const handleAnswer = (promptId: string, text: string) => {
    setAnswers((prev) => ({ ...prev, [promptId]: text }));
  };

  const handleSaveAndNext = async () => {
    if (dimensionIdx < DIMENSIONS.length - 1) {
      setDimensionIdx(dimensionIdx + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      try {
        const items = CORE_EVIDENCE_PROMPTS
          .filter((p) => answers[p.id] && answers[p.id].trim().length > 0)
          .map((p) => ({
            dimension: p.dimension,
            promptId: p.id,
            text: answers[p.id].trim(),
          }));
        await saveMutation.mutateAsync({ items });
        toast.success("Evidências salvas!");
        onNext();
      } catch {
        toast.error("Erro ao salvar. Tente novamente.");
      }
    }
  };

  const handlePrevDimension = () => {
    if (dimensionIdx > 0) {
      setDimensionIdx(dimensionIdx - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      onPrev();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-muted-foreground">Carregando respostas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                {currentDimension.label} — Evidências
              </CardTitle>
              <CardDescription>
                Dimensão {dimensionIdx + 1} de {DIMENSIONS.length} — Descreva situações reais
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-1 mt-3">
            {DIMENSIONS.map((d, i) => (
              <div
                key={d.key}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i < dimensionIdx
                    ? "bg-primary"
                    : i === dimensionIdx
                      ? "bg-primary/60"
                      : "bg-muted"
                }`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {dimensionPrompts.map((prompt, i) => (
            <div key={prompt.id} className="space-y-2">
              <label className="text-sm font-medium text-foreground leading-relaxed block">
                <span className="text-muted-foreground mr-2">{i + 1}.</span>
                {prompt.text}
              </label>
              <Textarea
                value={answers[prompt.id] || ""}
                onChange={(e) => handleAnswer(prompt.id, e.target.value)}
                placeholder="Descreva com detalhes..."
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {(answers[prompt.id] || "").length < 10
                  ? `Mínimo 10 caracteres (${(answers[prompt.id] || "").length}/10)`
                  : `${(answers[prompt.id] || "").length} caracteres`}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-between gap-3">
        <Button variant="outline" onClick={handlePrevDimension} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <Button
          onClick={handleSaveAndNext}
          disabled={!allAnswered || saveMutation.isPending}
          className="gap-2"
        >
          {saveMutation.isPending ? (
            "Salvando..."
          ) : dimensionIdx < DIMENSIONS.length - 1 ? (
            <>
              Próxima dimensão
              <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Salvar e continuar
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
