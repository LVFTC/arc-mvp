import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ArrowRight, Save, Target, Calendar } from "lucide-react";
import { toast } from "sonner";
import { PLAN_90D_BLOCKS } from "@shared/plan90dTemplates";

interface Plan90DProps {
  onNext: () => void;
  onPrev: () => void;
}

type SelectionMap = Record<string, string[]>;

export default function Plan90D({ onNext, onPrev }: Plan90DProps) {
  const [cycleObjective, setCycleObjective] = useState("");
  const [checkpointDates, setCheckpointDates] = useState(["", "", ""]);
  const [selections, setSelections] = useState<SelectionMap>({ "70": [], "20": [], "10": [] });
  const [loaded, setLoaded] = useState(false);

  const { data: existing } = trpc.plan90d.get.useQuery();
  const saveMutation = trpc.plan90d.save.useMutation();
  const utils = trpc.useUtils();

  // Load existing data
  useEffect(() => {
    if (existing && !loaded) {
      setLoaded(true);
      if (existing.cycleObjective) setCycleObjective(existing.cycleObjective);
      setCheckpointDates([
        existing.checkpoint1Date ?? "",
        existing.checkpoint2Date ?? "",
        existing.checkpoint3Date ?? "",
      ]);
      setSelections({
        "70": (existing.selected70 as string[]) ?? [],
        "20": (existing.selected20 as string[]) ?? [],
        "10": (existing.selected10 as string[]) ?? [],
      });
    }
  }, [existing, loaded]);

  const toggleOption = (blockKey: string, optionId: string, maxSelections: number) => {
    setSelections(prev => {
      const current = prev[blockKey] ?? [];
      if (current.includes(optionId)) {
        return { ...prev, [blockKey]: current.filter(id => id !== optionId) };
      }
      if (current.length >= maxSelections) {
        toast.warning(`Selecione no máximo ${maxSelections} opção${maxSelections > 1 ? "ões" : ""} neste bloco.`);
        return prev;
      }
      return { ...prev, [blockKey]: [...current, optionId] };
    });
  };

  const isComplete = () => {
    return PLAN_90D_BLOCKS.every(block => (selections[block.key] ?? []).length > 0);
  };

  const handleSave = async (andNext = false) => {
    try {
      await saveMutation.mutateAsync({
        cycleObjective: cycleObjective || null,
        checkpoint1Date: checkpointDates[0] || null,
        checkpoint2Date: checkpointDates[1] || null,
        checkpoint3Date: checkpointDates[2] || null,
        selected70: selections["70"],
        selected20: selections["20"],
        selected10: selections["10"],
      });
      await utils.plan90d.get.invalidate();
      await utils.assessment.status.invalidate();
      toast.success("Plano salvo.");
      if (andNext) onNext();
    } catch {
      toast.error("Erro ao salvar. Tente novamente.");
    }
  };

  const totalSelected = Object.values(selections).reduce((acc, arr) => acc + arr.length, 0);
  const totalRequired = PLAN_90D_BLOCKS.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Mini Plano 90 Dias</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Escolha 1–2 hipóteses por bloco para o próximo ciclo. Não é um compromisso definitivo — é um ponto de partida para experimentar.
        </p>
      </div>

      {/* Objetivo do ciclo */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Objetivo do ciclo</CardTitle>
          <CardDescription className="text-xs">
            Em uma frase: o que você quer ter avançado ao final dos 90 dias?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Ex: Consolidar minha posição como referência técnica no time de dados"
            value={cycleObjective}
            onChange={e => setCycleObjective(e.target.value)}
            maxLength={300}
            className="text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1 text-right">
            {cycleObjective.length}/300
          </p>
        </CardContent>
      </Card>

      {/* Blocos 70/20/10 */}
      {PLAN_90D_BLOCKS.map(block => {
        const selected = selections[block.key] ?? [];
        return (
          <Card key={block.key} className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{block.title}</CardTitle>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  selected.length > 0
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {selected.length}/{block.maxSelections} selecionado{selected.length !== 1 ? "s" : ""}
                </span>
              </div>
              <CardDescription className="text-xs">{block.subtitle}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {block.options.map(option => {
                const isSelected = selected.includes(option.id);
                const isDisabled = !isSelected && selected.length >= block.maxSelections;
                return (
                  <div
                    key={option.id}
                    onClick={() => !isDisabled && toggleOption(block.key, option.id, block.maxSelections)}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : isDisabled
                          ? "border-border bg-muted/30 opacity-50 cursor-not-allowed"
                          : "border-border bg-background hover:border-primary/40 hover:bg-primary/3"
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      disabled={isDisabled}
                      onCheckedChange={() => !isDisabled && toggleOption(block.key, option.id, block.maxSelections)}
                      className="mt-0.5 shrink-0"
                    />
                    <div className="space-y-0.5 min-w-0">
                      <p className={`text-sm font-medium leading-snug ${isSelected ? "text-primary" : "text-foreground"}`}>
                        {option.label}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {option.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      {/* Checkpoints quinzenais */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Checkpoints quinzenais</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Defina 3 datas para revisar seu progresso ao longo do ciclo. Opcional, mas recomendado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((num, idx) => (
              <div key={num} className="space-y-1">
                <Label className="text-xs text-muted-foreground">Checkpoint {num}</Label>
                <Input
                  type="date"
                  value={checkpointDates[idx]}
                  onChange={e => {
                    const updated = [...checkpointDates];
                    updated[idx] = e.target.value;
                    setCheckpointDates(updated);
                  }}
                  className="text-sm"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Progress indicator */}
      {!isComplete() && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <span className="text-amber-600 text-sm">
            Selecione pelo menos 1 opção em cada bloco para continuar ({totalSelected}/{totalRequired} blocos preenchidos).
          </span>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" onClick={onPrev} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={saveMutation.isPending}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            Salvar
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={!isComplete() || saveMutation.isPending}
            className="gap-2"
          >
            Continuar
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
