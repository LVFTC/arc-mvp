import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LikertQuestion } from "@/components/LikertQuestion";
import { CORE_LIKERT_ITEMS, DIMENSIONS } from "@shared/questionBank";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { ArcTeaches, type ArcTeachesContent } from "@/components/ArcTeaches";

// ArcTeaches content por dimensão — mantido do original
const DIMENSION_TEACHES: Record<string, ArcTeachesContent> = {
  self_management: {
    why: "Autogestão é a agilidade que modera todas as outras. Um alto score em Resultados combinado com baixa Autogestão pode indicar desempenho instável sob pressão. Não é sobre ser 'disciplinado' — é sobre operar bem quando o ambiente não coopera.",
    trap: "Confundir autogestão com rigidez. Alta autogestão não significa agenda cheia e zero desvio. Significa capacidade de ajustar sem desestabilizar.",
    howTo: [
      "Pense em situações de alta pressão recentes. Você conseguia manter qualidade de entrega?",
      "Quando algo saiu do plano, quanto tempo levou para readaptar?",
      "Inclua situações profissionais E pessoais que afetaram seu trabalho.",
    ],
  },
  mental: {
    why: "Agilidade Mental mede capacidade de aprender, sintetizar e resolver problemas novos. Não é QI — é velocidade de internalizar frameworks e aplicar em contextos diferentes.",
    trap: "Confundir com conhecimento acumulado. Alguém pode ter muito conhecimento e baixa agilidade mental (não adapta bem). O oposto também existe.",
    howTo: [
      "Pense em situações onde você precisou resolver algo sem precedente claro.",
      "Quando foi a última vez que aprendeu algo novo e aplicou rápido?",
      "Avalie sua facilidade em mudar de contexto mental durante o dia.",
    ],
  },
  people: {
    why: "Agilidade com Pessoas não é sobre ser extrovertido. É sobre ler contextos relacionais, adaptar comunicação e construir confiança de forma deliberada.",
    trap: "Avaliar pelo volume de interações sociais. Alguém introspectivo pode ter alta agilidade com pessoas se calibra bem cada interação.",
    howTo: [
      "Pense em conversas difíceis que você conduziu bem (ou mal).",
      "Avalie sua capacidade de influenciar sem autoridade formal.",
      "Inclua situações de feedback dado e recebido.",
    ],
  },
  change: {
    why: "Agilidade com Mudanças mede tolerância à ambiguidade e capacidade de navegar instabilidade sem travar. É um preditor forte de performance em ambientes de crescimento acelerado.",
    trap: "Avaliar apenas mudanças grandes (troca de emprego, mudança de cidade). Inclua micro-mudanças: pivôs de projeto, mudanças de prioridade, novos gestores.",
    howTo: [
      "Como você reage quando um projeto muda de escopo no meio do caminho?",
      "Você consegue agir com 60% das informações ou precisa de certeza para começar?",
      "Inclua situações onde a mudança não foi escolha sua.",
    ],
  },
  results: {
    why: "Agilidade com Resultados é sobre foco, priorização e entrega consistente. Não é sobre trabalhar mais horas — é sobre escolher o que move o ponteiro e executar até o fim.",
    trap: "Confundir atividade com resultado. Alta agilidade aqui significa saber dizer não para o que não importa, não apenas entregar muito.",
    howTo: [
      "Liste suas últimas 5 entregas. Qual o impacto real de cada uma?",
      "Avalie sua capacidade de priorizar quando tudo parece urgente.",
      "Inclua situações onde você abandonou algo por ser a coisa certa a fazer.",
    ],
  },
  innovation: {
    why: "É sobre a disposição de questionar o status quo, testar hipóteses com recursos limitados e aprender com experimentos que não deram certo.",
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
  // FASE B: indicador inline em vez de toast (evita removeChild crash no Safari)
  const [savedIndicator, setSavedIndicator] = useState(false);
  const saveMutation = trpc.likert.save.useMutation();

  const { data: existingAnswers, isLoading } = trpc.likert.get.useQuery();

  useEffect(() => {
    if (existingAnswers && existingAnswers.length > 0 && !loadedRef.current) {
      loadedRef.current = true;
      const loaded: Record<string, number> = {};
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

        // Indicador inline — sem toast (evita crash Safari)
        setSavedIndicator(true);
        setTimeout(() => {
          setSavedIndicator(false);
          onNext();
        }, 800);
      } catch {
        toast.error("Erro ao salvar. Tente novamente.");
      }
    }
  };

  const isLastDimension = dimensionIdx === DIMENSIONS.length - 1;
  const teach = DIMENSION_TEACHES[currentDimension.key];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-muted-foreground">Carregando respostas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Dimensão {dimensionIdx + 1} de {DIMENSIONS.length}</span>
        <span>{totalAnswered}/{totalItems} itens respondidos</span>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{currentDimension.label}</CardTitle>

        </CardHeader>
        <CardContent className="space-y-4">
          {teach && <ArcTeaches content={teach} />}

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
        <Button
          variant="outline"
          onClick={() => {
            if (dimensionIdx > 0) {
              setDimensionIdx(dimensionIdx - 1);
              window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
              onPrev();
            }
          }}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <Button
          onClick={handleSaveAndNext}
          disabled={!allAnswered || saveMutation.isPending || savedIndicator}
          className="gap-2"
        >
          {savedIndicator ? (
            <><Check className="w-4 h-4" /> Salvo</>
          ) : saveMutation.isPending ? (
            "Salvando..."
          ) : isLastDimension ? (
            <><Check className="w-4 h-4" /> Salvar e continuar</>
          ) : (
            <><ArrowRight className="w-4 h-4" /> Próxima dimensão</>
          )}
        </Button>
      </div>
    </div>
  );
}
