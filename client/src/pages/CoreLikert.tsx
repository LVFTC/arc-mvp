import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LikertQuestion } from "@/components/LikertQuestion";
import { CORE_LIKERT_ITEMS, DIMENSIONS } from "@shared/questionBank";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ArrowRight, Save } from "lucide-react";
import { toast } from "sonner";
import { ArcTeaches, type ArcTeachesContent } from "@/components/ArcTeaches";

// Microintervenções por dimensão
const DIMENSION_TEACHES: Record<string, ArcTeachesContent> = {
  self_management: {
    why: "Autogestão sustenta a sua consistência. Sem ela, habilidades técnicas e sociais ficam instáveis. Aqui estamos mapeando sua capacidade de (1) cumprir compromissos, (2) se regular emocionalmente e (3) perceber quando seu comportamento começa a atrapalhar suas decisões e relações.",
    trap: "Responder com base no 'eu deveria ser' em vez do 'eu costumo fazer'. O ARC não é uma prova e não tem resposta certa. O valor está em mapear o padrão real.",
    howTo: [
      "Responda pensando na sua média dos últimos 3 meses, não no seu melhor dia.",
      "Se você ficar entre 'Concordo' e 'Concordo totalmente', marque 'Concordo'. A hesitação já é um dado.",
      "Itens invertidos (ex.: 'tenho dificuldade...') existem para reduzir viés. Responda com honestidade, não com a versão ideal.",
    ],
  },
  learning_agility: {
    why: "Agilidade de aprendizado é o preditor mais forte de sucesso em ambientes de mudança. Estamos medindo se você busca ativamente novos desafios, aprende com erros e transfere aprendizados para contextos diferentes.",
    trap: "Confundir 'gosto de aprender' com 'aprendo com velocidade e transfiro para a prática'. São coisas diferentes.",
    howTo: [
      "Foque em comportamentos concretos: você realmente buscou feedback após um erro recente?",
      "Pense em situações onde você saiu da zona de conforto profissional nos últimos 12 meses.",
      "Aprendizado ágil inclui desaprender — questionar crenças antigas é parte do processo.",
    ],
  },
  collaboration: {
    why: "Colaboração não é 'ser legal com todos'. É a capacidade de criar resultados coletivos melhores do que os individuais — incluindo navegar conflitos, influenciar sem autoridade e construir confiança.",
    trap: "Avaliar colaboração pela frequência de reuniões ou pela ausência de conflito. Conflito bem gerenciado é sinal de colaboração madura.",
    howTo: [
      "Pense em projetos onde você dependeu de pessoas fora da sua hierarquia direta.",
      "Avalie sua capacidade de ceder em pontos menores para avançar em pontos maiores.",
      "Colaboração inclui dar crédito, compartilhar informação e pedir ajuda — não só entregar.",
    ],
  },
  communication: {
    why: "Comunicação é o multiplicador de todas as outras competências. Estamos medindo clareza, adaptação de linguagem para diferentes audiências e capacidade de ouvir ativamente — não apenas de falar bem.",
    trap: "Confundir 'falo muito' ou 'sou extrovertido' com comunicação eficaz. Comunicação é sobre impacto no receptor, não volume do emissor.",
    howTo: [
      "Pense em situações onde você precisou comunicar algo difícil ou impopular.",
      "Avalie se você adapta o nível técnico da sua comunicação para a audiência.",
      "Escuta ativa significa reformular o que o outro disse antes de responder — você faz isso?",
    ],
  },
  innovation: {
    why: "Inovação no contexto do Arc não é sobre ter ideias geniais. É sobre a disposição de questionar o status quo, testar hipóteses com recursos limitados e aprender com experimentos que não deram certo.",
    trap: "Avaliar inovação pela quantidade de ideias geradas. O que importa é a capacidade de levar uma ideia do conceito à execução, mesmo com incerteza.",
    howTo: [
      "Pense em situações onde você propôs uma mudança de processo ou abordagem diferente.",
      "Avalie sua tolerância a ambiguidade: você consegue agir com 60% das informações?",
      "Inovação inclui dizer não para o que não funciona — abandono intencional é uma competência.",
    ],
  },
};

interface CoreLikertProps {
  onNext: () => void;
  onPrev: () => void;
}

export default function CoreLikert({ onNext, onPrev }: CoreLikertProps) {
  const [dimensionIdx, setDimensionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const loadedRef = useRef(false);
  const saveMutation = trpc.likert.save.useMutation();

  // Load existing answers from DB
  const { data: existingAnswers, isLoading } = trpc.likert.get.useQuery();

  useEffect(() => {
    if (existingAnswers && existingAnswers.length > 0 && !loadedRef.current) {
      loadedRef.current = true;
      const loaded: Record<string, number> = {};
      // Only load CORE items (not bigfive)
      const coreIds = new Set(CORE_LIKERT_ITEMS.map(i => i.id));
      existingAnswers
        .filter(a => coreIds.has(a.itemId))
        .forEach(a => { loaded[a.itemId] = a.value; });
      if (Object.keys(loaded).length > 0) {
        setAnswers(loaded);
      }
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
      // Save all CORE likert answers
      try {
        const items = CORE_LIKERT_ITEMS
          .filter((item) => answers[item.id] !== undefined)
          .map((item) => ({
            dimension: item.dimension,
            itemId: item.id,
            value: answers[item.id],
            reverseFlag: item.reverse,
          }));
        await saveMutation.mutateAsync({ section: "core", items });
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
        <CardContent className="space-y-4">
          {/* Microintervenção ARC ensina a pensar */}
          {DIMENSION_TEACHES[currentDimension.key] && (
            <ArcTeaches content={DIMENSION_TEACHES[currentDimension.key]} />
          )}

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
