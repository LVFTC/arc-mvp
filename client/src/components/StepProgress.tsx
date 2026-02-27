import { Check } from "lucide-react";
import type { AssessmentStep } from "@/hooks/useAssessment";

interface StepProgressProps {
  steps: AssessmentStep[];
  currentStep: AssessmentStep;
  stepLabels: Record<AssessmentStep, string>;
  onStepClick?: (step: AssessmentStep) => void;
}

const VISIBLE_STEPS: AssessmentStep[] = [
  "core_likert",
  "core_evidence",
  "bigfive",
  "ikigai",
  "review",
];

export function StepProgress({ steps, currentStep, stepLabels, onStepClick }: StepProgressProps) {
  const allSteps = steps;
  const currentIdx = allSteps.indexOf(currentStep);

  if (currentStep === "welcome" || currentStep === "submitted") return null;

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between gap-1">
        {VISIBLE_STEPS.map((step, i) => {
          const stepIdx = allSteps.indexOf(step);
          const isCompleted = currentIdx > stepIdx;
          const isCurrent = currentStep === step;
          const isClickable = isCompleted && onStepClick;

          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <button
                type="button"
                onClick={() => isClickable && onStepClick(step)}
                disabled={!isClickable}
                className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold shrink-0 transition-all
                  ${isCompleted
                    ? "bg-primary text-primary-foreground"
                    : isCurrent
                      ? "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2"
                      : "bg-muted text-muted-foreground"
                  }
                  ${isClickable ? "hover:ring-2 hover:ring-primary/20 hover:ring-offset-1" : ""}
                `}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : i + 1}
              </button>
              {i < VISIBLE_STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 rounded transition-colors ${
                    currentIdx > stepIdx ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2">
        {VISIBLE_STEPS.map((step) => (
          <span
            key={step}
            className={`text-[10px] sm:text-xs text-center ${
              currentStep === step ? "text-primary font-semibold" : "text-muted-foreground"
            }`}
            style={{ width: step === "review" ? "auto" : undefined }}
          >
            {stepLabels[step]}
          </span>
        ))}
      </div>
    </div>
  );
}
