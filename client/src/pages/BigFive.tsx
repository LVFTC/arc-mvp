import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LikertQuestion } from "@/components/LikertQuestion";
import { BIG_FIVE_ITEMS, BIG_FIVE_TRAITS } from "@shared/questionBank";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Save, Fingerprint } from "lucide-react";
import { toast } from "sonner";
import { ArcTeaches, type ArcTeachesContent } from "@/components/ArcTeaches";

const BIG_FIVE_TEACH: ArcTeachesContent = {
  why: "O Big Five (Mini-IPIP) é o modelo de personalidade mais validado cientificamente no mundo. Ele não mede competência — mede tendências naturais de comportamento. Esses dados complementam suas agilidades e ajudam a identificar contextos onde você tende a prosperar ou a se desgastar.",
  trap: "Responder como você 'gostaria de ser' em vez de como você realmente é. Introversão não é fraqueza, baixa abertura não é limitante — cada perfil tem contextos ótimos.",
  howTo: [
    "Responda pensando em como você é na maioria das situações, não no seu melhor ou pior dia.",
    "Não existe perfil ideal — o objetivo é mapear seu ponto de partida real, não um destino desejado.",
    "Itens invertidos (ex: 'Tenho dificuldade em...') são intencionais para reduzir viés de desejabilidade social.",
  ],
};

interface BigFiveProps {
  onNext: () => void;
  onPrev: () => void;
}

export default function BigFive({ onNext, onPrev }: BigFiveProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const loadedRef = useRef(false);
  const saveMutation = trpc.likert.save.useMutation();

  const { data: existingAnswers, isLoading } = trpc.likert.get.useQuery();

  useEffect(() => {
    if (existingAnswers && existingAnswers.length > 0 && !loadedRef.current) {
      loadedRef.current = true;
      const loaded: Record<string, number> = {};
      const bfIds = new Set(BIG_FIVE_ITEMS.map(i => i.id));
      existingAnswers
        .filter(a => bfIds.has(a.itemId))
        .forEach(a => { loaded[a.itemId] = a.value; });
      if (Object.keys(loaded).length > 0) {
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
      await saveMutation.mutateAsync({ section: "bigfive", items });
      toast.success("Personalidade salva!");
      onNext();
    } catch {
      toast.error("Erro ao salvar. Tente novamente.");
    }
  };

  const groupedByTrait = BIG_FIVE_TRAITS.map((trait) => ({
    ...trait,
    items: BIG_FIVE_ITEMS.filter((item) => item.trait === trait.key),
  }));

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
          {/* Microintervenção ARC ensina a pensar */}
          <ArcTeaches content={BIG_FIVE_TEACH} />

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
