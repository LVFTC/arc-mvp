import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { IKIGAI_CIRCLES, IKIGAI_ZONES } from "@shared/questionBank";
import type { IkigaiCircleKey, IkigaiZoneKey } from "@shared/questionBank";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ArrowRight, Save, Plus, X, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { ArcTeaches, type ArcTeachesContent } from "@/components/ArcTeaches";

const IKIGAI_TEACH: ArcTeachesContent = {
  why: "O IKIGAI é uma ferramenta de mapeamento de propósito, não de definição. Não estamos pedindo que você descubra 'sua missão de vida' agora. Estamos coletando dados sobre o que te energiza, o que você faz bem, o que o mundo precisa e pelo que já existe demanda — para cruzar essas informações no seu relatório.",
  trap: "Escrever o que você 'deveria' amar ou o que soa bem socialmente. O IKIGAI é mais útil quando honesto do que quando aspiracional.",
  howTo: [
    "Liste atividades, não valores abstratos. 'Resolver problemas complexos de dados' é melhor do que 'ser útil'.",
    "O ranking importa: o item 1 deve ser o que mais te define, não o que soa melhor.",
    "Para 'Posso ser pago': pense no mercado atual, não no mercado ideal. O que já existe demanda hoje?",
  ],
};

interface IkigaiWorksheetProps {
  onNext: () => void;
  onPrev: () => void;
}

interface IkigaiEntry {
  text: string;
  rank: number;
}

type CircleData = Record<IkigaiCircleKey, IkigaiEntry[]>;

export default function IkigaiWorksheet({ onNext, onPrev }: IkigaiWorksheetProps) {
  const [circleIdx, setCircleIdx] = useState(0);
  const [circleData, setCircleData] = useState<CircleData>({
    love: [],
    good_at: [],
    world_needs: [],
    paid_for: [],
  });
  const [chosenZone, setChosenZone] = useState<IkigaiZoneKey | null>(null);
  const [showZoneSelection, setShowZoneSelection] = useState(false);
  const loadedIkigaiRef = useRef(false);
  const loadedChoicesRef = useRef(false);

  const saveIkigaiMutation = trpc.ikigai.save.useMutation();
  const saveChoicesMutation = trpc.choices.save.useMutation();

  // Load existing data
  const { data: existingIkigai, isLoading: ikigaiLoading } = trpc.ikigai.get.useQuery();
  const { data: existingChoices } = trpc.choices.get.useQuery();

  useEffect(() => {
    if (existingIkigai && existingIkigai.length > 0 && !loadedIkigaiRef.current) {
      loadedIkigaiRef.current = true;
      const loaded: CircleData = { love: [], good_at: [], world_needs: [], paid_for: [] };
      existingIkigai.forEach((item) => {
        const circle = item.circle as IkigaiCircleKey;
        if (loaded[circle]) {
          loaded[circle].push({ text: item.text, rank: item.rank });
        }
      });
      Object.keys(loaded).forEach((k) => {
        loaded[k as IkigaiCircleKey].sort((a, b) => a.rank - b.rank);
      });
      const hasData = Object.values(loaded).some((arr) => arr.length > 0);
      if (hasData) {
        setCircleData(loaded);
      }
    }
  }, [existingIkigai]);

  useEffect(() => {
    if (existingChoices && existingChoices.chosenZone && !loadedChoicesRef.current) {
      loadedChoicesRef.current = true;
      setChosenZone(existingChoices.chosenZone as IkigaiZoneKey);
    }
  }, [existingChoices]);

  const currentCircle = IKIGAI_CIRCLES[circleIdx];
  const currentItems = circleData[currentCircle.key];

  const addItem = () => {
    if (currentItems.length >= 5) return;
    setCircleData((prev) => ({
      ...prev,
      [currentCircle.key]: [
        ...prev[currentCircle.key],
        { text: "", rank: prev[currentCircle.key].length + 1 },
      ],
    }));
  };

  const removeItem = (idx: number) => {
    setCircleData((prev) => {
      const updated = prev[currentCircle.key].filter((_, i) => i !== idx);
      return {
        ...prev,
        [currentCircle.key]: updated.map((item, i) => ({ ...item, rank: i + 1 })),
      };
    });
  };

  const updateItemText = (idx: number, text: string) => {
    setCircleData((prev) => ({
      ...prev,
      [currentCircle.key]: prev[currentCircle.key].map((item, i) =>
        i === idx ? { ...item, text } : item
      ),
    }));
  };

  const moveItem = (idx: number, direction: "up" | "down") => {
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= currentItems.length) return;
    setCircleData((prev) => {
      const items = [...prev[currentCircle.key]];
      [items[idx], items[newIdx]] = [items[newIdx], items[idx]];
      return {
        ...prev,
        [currentCircle.key]: items.map((item, i) => ({ ...item, rank: i + 1 })),
      };
    });
  };

  const circleValid = currentItems.length >= 3 && currentItems.every((item) => item.text.trim().length > 0);
  const allCirclesValid = IKIGAI_CIRCLES.every(
    (c) => circleData[c.key].length >= 3 && circleData[c.key].every((item) => item.text.trim().length > 0)
  );

  const handleNextCircle = () => {
    if (circleIdx < IKIGAI_CIRCLES.length - 1) {
      setCircleIdx(circleIdx + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setShowZoneSelection(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevCircle = () => {
    if (showZoneSelection) {
      setShowZoneSelection(false);
    } else if (circleIdx > 0) {
      setCircleIdx(circleIdx - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      onPrev();
    }
  };

  const handleSaveAll = async () => {
    try {
      const allItems: { circle: "love" | "good_at" | "world_needs" | "paid_for"; text: string; rank: number }[] = [];
      (Object.keys(circleData) as IkigaiCircleKey[]).forEach((circle) => {
        circleData[circle].forEach((item) => {
          if (item.text.trim()) {
            allItems.push({ circle, text: item.text.trim(), rank: item.rank });
          }
        });
      });
      await saveIkigaiMutation.mutateAsync({ items: allItems });
      if (chosenZone) {
        await saveChoicesMutation.mutateAsync({ chosenZone, assessmentStatus: "in_progress" });
      }
      toast.success("IKIGAI salvo!");
      onNext();
    } catch {
      toast.error("Erro ao salvar. Tente novamente.");
    }
  };

  if (ikigaiLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-muted-foreground">Carregando dados...</div>
      </div>
    );
  }

  // Zone selection view
  if (showZoneSelection) {
    return (
      <div className="space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Escolha sua Zona Foco</CardTitle>
            <CardDescription>
              Com base nas suas respostas, qual zona do IKIGAI você quer explorar no próximo ciclo de 90 dias?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {IKIGAI_ZONES.map((zone) => (
              <button
                key={zone.key}
                type="button"
                onClick={() => setChosenZone(zone.key)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  chosenZone === zone.key
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <div className="font-semibold text-sm">{zone.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{zone.description}</div>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-between gap-3">
          <Button variant="outline" onClick={handlePrevCircle} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <Button
            onClick={handleSaveAll}
            disabled={!chosenZone || !allCirclesValid || saveIkigaiMutation.isPending}
            className="gap-2"
          >
            {saveIkigaiMutation.isPending ? "Salvando..." : (
              <>
                <Save className="w-4 h-4" />
                Salvar e revisar
              </>
            )}
          </Button>
        </div>
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
                <span className="mr-2">{currentCircle.emoji}</span>
                {currentCircle.label}
              </CardTitle>
              <CardDescription>
                Círculo {circleIdx + 1} de {IKIGAI_CIRCLES.length} — Liste de 3 a 5 itens e ordene por prioridade
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-1 mt-3">
            {IKIGAI_CIRCLES.map((c, i) => (
              <div
                key={c.key}
                className={`h-1.5 flex-1 rounded-full transition-colors`}
                style={{
                  backgroundColor: i < circleIdx ? c.color : i === circleIdx ? `${c.color}99` : "#e5e7eb",
                }}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Microintervenção ARC ensina a pensar */}
          <ArcTeaches content={IKIGAI_TEACH} />

          {/* Prompts */}
          <div className="p-3 rounded-lg bg-muted/50 space-y-1">
            {currentCircle.prompts.map((prompt, i) => (
              <p key={i} className="text-sm text-muted-foreground italic">
                {prompt}
              </p>
            ))}
          </div>

          {/* Items list */}
          <div className="space-y-2">
            {currentItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card">
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveItem(idx, "up")}
                    disabled={idx === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 p-0.5"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(idx, "down")}
                    disabled={idx === currentItems.length - 1}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 p-0.5"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ backgroundColor: currentCircle.color }}
                >
                  {idx + 1}
                </span>
                <Input
                  value={item.text}
                  onChange={(e) => updateItemText(idx, e.target.value)}
                  placeholder={`Item ${idx + 1}...`}
                  className="flex-1 border-0 bg-transparent focus-visible:ring-0 px-1"
                />
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="text-muted-foreground hover:text-destructive p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {currentItems.length < 5 && (
            <Button
              variant="outline"
              size="sm"
              onClick={addItem}
              className="gap-2 w-full border-dashed"
            >
              <Plus className="w-4 h-4" />
              Adicionar item ({currentItems.length}/5)
            </Button>
          )}

          {currentItems.length < 3 && (
            <p className="text-xs text-destructive">
              Mínimo de 3 itens necessários ({currentItems.length}/3)
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between gap-3">
        <Button variant="outline" onClick={handlePrevCircle} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <Button
          onClick={handleNextCircle}
          disabled={!circleValid}
          className="gap-2"
        >
          {circleIdx < IKIGAI_CIRCLES.length - 1 ? (
            <>
              Próximo círculo
              <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            <>
              Escolher zona
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
