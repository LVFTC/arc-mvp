import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { IKIGAI_CIRCLES, IKIGAI_ZONES } from "@shared/questionBank";
import type { IkigaiCircleKey, IkigaiZoneKey } from "@shared/questionBank";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ArrowRight, Save, Plus, X, ChevronUp, ChevronDown, Check, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { ArcTeaches, type ArcTeachesContent } from "@/components/ArcTeaches";

const IKIGAI_TEACH: ArcTeachesContent = {
  why: "O IKIGAI aqui é um instrumento de mapeamento, não uma definição final. Não estamos pedindo que você descubra 'sua missão de vida' agora. Estamos coletando dados sobre o que te energiza, no que você entrega bem, que tipo de impacto te importa e quais caminhos têm demanda. O objetivo é gerar hipóteses consistentes.",
  trap: "Preencher com respostas aspiracionais (o que soa bem) em vez do que é verdadeiro e recorrente. Isso deixa o mapa bonito, mas inútil para decisão.",
  howTo: [
    "Liste atividades e temas concretos, não valores abstratos.",
    "Leve o ranking a sério. O item 1 é o que mais te move hoje, não o que parece mais 'nobre'.",
    "Em 'Posso ser pago', pense no mercado atual e no que já existe demanda hoje. Não no cenário ideal.",
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
  // FASE B: indicador inline em vez de toast
  const [savedIndicator, setSavedIndicator] = useState(false);

  const saveIkigaiMutation = trpc.ikigai.save.useMutation();
  const saveChoicesMutation = trpc.choices.save.useMutation();

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
      if (hasData) setCircleData(loaded);
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

  const circleValid =
    currentItems.length >= 3 && currentItems.every((item) => item.text.trim().length > 0);
  const allCirclesValid = IKIGAI_CIRCLES.every(
    (c) =>
      circleData[c.key].length >= 3 &&
      circleData[c.key].every((item) => item.text.trim().length > 0)
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

      // FASE B: indicador inline — sem toast (evita crash Safari)
      setSavedIndicator(true);
      setTimeout(() => {
        setSavedIndicator(false);
        onNext();
      }, 800);
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
            disabled={!chosenZone || !allCirclesValid || saveIkigaiMutation.isPending || savedIndicator}
            className="gap-2"
          >
            {savedIndicator ? (
              <><Check className="w-4 h-4" /> Salvo</>
            ) : saveIkigaiMutation.isPending ? (
              "Salvando..."
            ) : (
              <><Save className="w-4 h-4" /> Salvar e revisar</>
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
          {/* Barra de progresso dos círculos */}
          <div className="flex gap-1 mt-3">
            {IKIGAI_CIRCLES.map((c, i) => (
              <div
                key={c.key}
                className="h-1.5 flex-1 rounded-full transition-colors"
                style={{
                  backgroundColor:
                    i < circleIdx
                      ? c.color
                      : i === circleIdx
                      ? c.color
                      : "#e2e8f0",
                  opacity: i <= circleIdx ? 1 : 0.3,
                }}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ArcTeaches — apenas no primeiro círculo */}
          {circleIdx === 0 && <ArcTeaches content={IKIGAI_TEACH} />}

          {/* ── FASE C: Perguntas-guia destacadas ────────────────────── */}
          {currentCircle.prompts && currentCircle.prompts.length > 0 && (
            <div className="rounded-lg border-l-4 border-primary bg-primary/5 px-4 py-3">
              <div className="flex items-center gap-1.5 mb-2">
                <HelpCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                  Perguntas-guia
                </span>
              </div>
              <ul className="space-y-1.5">
                {currentCircle.prompts.map((prompt, i) => (
                  <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                    <span className="text-primary mt-0.5 flex-shrink-0">→</span>
                    {prompt}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-2.5 italic">
                Use isso para pensar. Você não precisa responder aqui.
              </p>
            </div>
          )}
          {/* ─────────────────────────────────────────────────────────── */}

          {/* Itens do círculo */}
          <div className="space-y-2">
            {currentItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: currentCircle.color }}
                >
                  {idx + 1}
                </span>
                <Input
                  value={item.text}
                  onChange={(e) => updateItemText(idx, e.target.value)}
                  placeholder={`Item ${idx + 1}...`}
                  className="flex-1"
                />
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => moveItem(idx, "up")}
                    disabled={idx === 0}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => moveItem(idx, "down")}
                    disabled={idx === currentItems.length - 1}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => removeItem(idx)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {currentItems.length < 5 && (
            <Button variant="outline" size="sm" onClick={addItem} className="gap-2 w-full">
              <Plus className="w-4 h-4" />
              Adicionar item
            </Button>
          )}

          {currentItems.length < 3 && (
            <p className="text-xs text-amber-600 text-center">
              Adicione pelo menos 3 itens para continuar.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between gap-3">
        <Button variant="outline" onClick={handlePrevCircle} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <Button onClick={handleNextCircle} disabled={!circleValid} className="gap-2">
          {circleIdx < IKIGAI_CIRCLES.length - 1 ? (
            <><ArrowRight className="w-4 h-4" /> Próximo círculo</>
          ) : (
            <><ArrowRight className="w-4 h-4" /> Escolher zona</>
          )}
        </Button>
      </div>
    </div>
  );
}
