import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LikertQuestion } from "@/components/LikertQuestion";
import { BIG_FIVE_ITEMS, BIG_FIVE_TRAITS } from "@shared/questionBank";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Save, Fingerprint } from "lucide-react";
import { toast } from "sonner";

interface BigFiveProps {
  onNext: () => void;
  onPrev: () => void;
}

export default function BigFive({ onNext, onPrev }: BigFiveProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const saveMutation = trpc.likert.save.useMutation();

  const { data: existingAnswers } = trpc.likert.get.useQuery();
  useMemo(() => {
    if (existingAnswers && existingAnswers.length > 0) {
      const loaded: Record<string, number> = {};
      existingAnswers
        .filter((a) => a.itemId.startsWith("bf_"))
        .forEach((a) => { loaded[a.itemId] = a.value; });
      if (Object.keys(loaded).length > 0 && Object.keys(answers).length === 0) {
        setAnswers(loaded);
      }
    }
  }, [existingAnswers]);

  const allAnswered = BIG_FIVE_ITEMS.every((item) => answers[item.id] !== undefined);
  const totalAnswered = BIG_FIVE_ITEMS.filter((item) => answers[item.id] !== undefined).length;

  const handleAnswer = (itemId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [itemId]: value }));
  };

  const handleSave = async () => {
    try {
      const items = BIG_FIVE_ITEMS
        .filter((item) => answers[item.id] !== undefined)
        .map((item) => ({
          dimension: `bigfive_${item.trait}`,
          itemId: item.id,
          value: answers[item.id],
          reverseFlag: item.reverse,
        }));
      await saveMutation.mutateAsync({ items });
      toast.success("Personalidade salva!");
      onNext();
    } catch {
      toast.error("Erro ao salvar. Tente novamente.");
    }
  };

  // Group items by trait for visual organization
  const groupedByTrait = BIG_FIVE_TRAITS.map((trait) => ({
    ...trait,
    items: BIG_FIVE_ITEMS.filter((item) => item.trait === trait.key),
  }));

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-primary" />
                Perfil de Personalidade (Big Five)
              </CardTitle>
              <CardDescription>
                20 afirmações rápidas baseadas no Mini-IPIP (domínio público).
                Avalie o quanto cada afirmação descreve você.
              </CardDescription>
            </div>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              {totalAnswered}/{BIG_FIVE_ITEMS.length}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {groupedByTrait.map((trait) => (
            <div key={trait.key} className="space-y-3">
              <h3 className="text-sm font-semibold text-primary border-b border-border pb-1">
                {trait.label}
              </h3>
              {trait.items.map((item, i) => (
                <LikertQuestion
                  key={item.id}
                  itemId={item.id}
                  text={item.text}
                  value={answers[item.id]}
                  onChange={(v) => handleAnswer(item.id, v)}
                  index={i + 1}
                />
              ))}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-between gap-3">
        <Button variant="outline" onClick={onPrev} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <Button
          onClick={handleSave}
          disabled={!allAnswered || saveMutation.isPending}
          className="gap-2"
        >
          {saveMutation.isPending ? "Salvando..." : (
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
