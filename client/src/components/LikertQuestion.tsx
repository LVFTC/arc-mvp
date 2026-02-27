import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { LIKERT_SCALE } from "@shared/questionBank";

interface LikertQuestionProps {
  itemId: string;
  text: string;
  value: number | undefined;
  onChange: (value: number) => void;
  index: number;
}

export function LikertQuestion({ itemId, text, value, onChange, index }: LikertQuestionProps) {
  return (
    <div className="p-4 rounded-lg border border-border bg-card space-y-3">
      <p className="text-sm font-medium text-foreground leading-relaxed">
        <span className="text-muted-foreground mr-2">{index}.</span>
        {text}
      </p>
      <RadioGroup
        value={value?.toString()}
        onValueChange={(v) => onChange(parseInt(v))}
        className="flex flex-wrap gap-2"
      >
        {LIKERT_SCALE.map((option) => (
          <div key={option.value} className="flex items-center">
            <RadioGroupItem
              value={option.value.toString()}
              id={`${itemId}-${option.value}`}
              className="peer sr-only"
            />
            <Label
              htmlFor={`${itemId}-${option.value}`}
              className={`
                px-3 py-2 rounded-md text-xs font-medium border transition-all cursor-pointer
                ${value === option.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                }
              `}
            >
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
