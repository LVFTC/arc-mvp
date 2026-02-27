import { useState, useCallback } from "react";

export type AssessmentStep =
  | "welcome"
  | "core_likert"
  | "core_evidence"
  | "bigfive"
  | "ikigai"
  | "plan90d"
  | "review"
  | "submitted";

const STEPS: AssessmentStep[] = [
  "welcome",
  "core_likert",
  "core_evidence",
  "bigfive",
  "ikigai",
  "plan90d",
  "review",
  "submitted",
];

const STEP_LABELS: Record<AssessmentStep, string> = {
  welcome: "Início",
  core_likert: "Agilidades",
  core_evidence: "Evidências",
  bigfive: "Personalidade",
  ikigai: "IKIGAI",
  plan90d: "Plano 90D",
  review: "Revisão",
  submitted: "Concluído",
};

export function useAssessment() {
  const [currentStep, setCurrentStep] = useState<AssessmentStep>("welcome");
  const [currentDimensionIndex, setCurrentDimensionIndex] = useState(0);

  const stepIndex = STEPS.indexOf(currentStep);
  const totalSteps = STEPS.length;
  const progress = Math.round((stepIndex / (totalSteps - 1)) * 100);

  const goToStep = useCallback((step: AssessmentStep) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const nextStep = useCallback(() => {
    const idx = STEPS.indexOf(currentStep);
    if (idx < STEPS.length - 1) {
      goToStep(STEPS[idx + 1]);
    }
  }, [currentStep, goToStep]);

  const prevStep = useCallback(() => {
    const idx = STEPS.indexOf(currentStep);
    if (idx > 0) {
      goToStep(STEPS[idx - 1]);
    }
  }, [currentStep, goToStep]);

  return {
    currentStep,
    stepIndex,
    totalSteps,
    progress,
    steps: STEPS,
    stepLabels: STEP_LABELS,
    goToStep,
    nextStep,
    prevStep,
    currentDimensionIndex,
    setCurrentDimensionIndex,
  };
}
