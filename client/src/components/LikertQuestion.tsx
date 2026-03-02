import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface LikertQuestionProps {
  itemId: string;
  text: string;
  value: number | undefined;
  onChange: (value: number) => void;
  index?: number;
  reversed?: boolean;
}

const LIKERT_OPTIONS = [
  { value: 1, label: "Discordo totalmente" },
  { value: 2, label: "Discordo" },
  { value: 3, label: "Neutro" },
  { value: 4, label: "Concordo" },
  { value: 5, label: "Concordo totalmente" },
];

export function LikertQuestion({
  itemId,
  text,
  value,
  onChange,
  index,
}: LikertQuestionProps) {
  // FIX B2: RadioGroup precisa de value sempre como string (nunca undefined)
  // undefined → "" evita o warning "uncontrolled → controlled"
  const radioValue = value !== undefined ? String(value) : "";

  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed">
        {index !== undefined && (
          <span className="inline-block w-6 text-muted-foreground font-medium mr-1">
            {index}.
          </span>
        )}
        {text}
      </p>

      <RadioGroup
        value={radioValue}
        onValueChange={(v) => onChange(Number(v))}
        className="grid grid-cols-5 gap-1"
        aria-label={text}
      >
        {LIKERT_OPTIONS.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <div key={opt.value} className="flex flex-col items-center gap-1">
              <RadioGroupItem
                value={String(opt.value)}
                id={`${itemId}-${opt.value}`}
                className="sr-only"
              />
              <Label
                htmlFor={`${itemId}-${opt.value}`}
                className={cn(
                  "w-full flex items-center justify-center rounded-md border-2 py-2 px-1 cursor-pointer text-center text-xs font-medium transition-all",
                  "hover:border-primary/40 hover:bg-primary/5",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground"
                )}
              >
                {opt.value}
              </Label>
              <span className="text-[10px] text-muted-foreground text-center leading-tight hidden sm:block">
                {opt.label}
              </span>
            </div>
          );
        })}
      </RadioGroup>

      {/* Mobile labels */}
      <div className="flex justify-between text-[10px] text-muted-foreground sm:hidden">
        <span>Discordo totalmente</span>
        <span>Concordo totalmente</span>
      </div>
    </div>
  );
}
