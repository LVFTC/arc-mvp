import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LikertQuestion } from "@/components/LikertQuestion";
import { CORE_LIKERT_ITEMS, DIMENSIONS } from "@shared/questionBank";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ArrowRight, Save } from "lucide-react";
import { toast } from "sonner";

interface CoreLikertProps {
  onNext: () => void;
  onPrev: () => void;
}

export default function CoreLikert({ onNext, onPrev }: CoreLikertProps) {
  const [dimensionIdx, setDimensionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const saveMutation = trpc.likert.save.useMutation();

  // Load existing answers
  const { data: existingAnswers } = trpc.likert.get.useQuery();
  useMemo(() => {
    if (existingAnswers && existingAnswers.length > 0 && Object.keys(answers).length === 0) {
      const loaded: Record<string, number> = {};
      existingAnswers.forEach((a) => { loaded[a.itemId] = a.value; });
      setAnswers(loaded);
    }
  }, [existingAnswers]);

  const currentDimension = DIMENSIONS[dimensionIdx];
  const dimensionItems = CORE_LIKERT_ITEMS.filter(
    (item) => item.dimension === currentDimension.key
  );

  const allAnswered = dimensionItems.every((item) => answers[item.id] !== undefined);
  const totalAnswered = CORE_LIKERT_ITEMS.filter((item) => answers[item.id] !== undefined).length;
  const totalItems = CORE_LIKERT_ITEMS.length;

  const handleAnswer = (itemId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [itemId]: value }));
  };

  const handleSaveAndNext = async () => {
    if (dimensionIdx < DIMENSIONS.length - 1) {
      setDimensionIdx(dimensionIdx + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Save all likert answers
      try {
        const items = CORE_LIKERT_ITEMS
          .filter((item) => answers[item.id] !== undefined)
          .map((item) => ({
            dimension: item.dimension,
            itemId: item.id,
            value: answers[item.id],
            reverseFlag: item.reverse,
          }));
        await saveMutation.mutateAsync({ items });
        toast.success("Respostas de agilidades salvas!");
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

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                {currentDimension.label}
              </CardTitle>
              <CardDescription>
                Dimensão {dimensionIdx + 1} de {DIMENSIONS.length} — Avalie cada afirmação
              </CardDescription>
            </div>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              {totalAnswered}/{totalItems}
            </span>
          </div>
          {/* Mini progress for dimensions */}
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
        <CardContent className="space-y-3">
          {dimensionItems.map((item, i) => (
            <LikertQuestion
              key={item.id}
              itemId={item.id}
              text={item.text}
              value={answers[item.id]}
              onChange={(v) => handleAnswer(item.id, v)}
              index={i + 1}
            />
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
