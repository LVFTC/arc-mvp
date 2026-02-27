import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { StepProgress } from "@/components/StepProgress";
import Welcome from "./Welcome";
import CoreLikert from "./CoreLikert";
import CoreEvidence from "./CoreEvidence";
import BigFive from "./BigFive";
import IkigaiWorksheet from "./IkigaiWorksheet";
import Plan90D from "./Plan90D";
import Review from "./Review";
import Submitted from "./Submitted";
import { trpc } from "@/lib/trpc";
import { GlobalProgress } from "@/components/GlobalProgress";

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

export default function Home() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState<AssessmentStep>("welcome");
  const resumeChecked = useRef(false);

  // Only query status if authenticated
  const { data: status, isLoading: statusLoading } = trpc.assessment.status.useQuery(
    undefined,
    { enabled: !!isAuthenticated }
  );

  // Resume session: set step based on backend status
  // NOTE: never auto-redirect to "submitted" — let the user choose to restart
  useEffect(() => {
    if (status && !resumeChecked.current) {
      resumeChecked.current = true;
      const resumeStep = status.resumeStep as AssessmentStep;
      if (STEPS.includes(resumeStep) && resumeStep !== "submitted") {
        setCurrentStep(resumeStep);
      }
    }
  }, [status]);

  const goToStep = (step: AssessmentStep) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const nextStep = () => {
    const idx = STEPS.indexOf(currentStep);
    if (idx < STEPS.length - 1) {
      goToStep(STEPS[idx + 1]);
    }
  };

  const prevStep = () => {
    const idx = STEPS.indexOf(currentStep);
    if (idx > 0) {
      goToStep(STEPS[idx - 1]);
    }
  };

  // Show loading while checking auth and status
  if (authLoading || (isAuthenticated && statusLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case "welcome":
        return <Welcome onStart={nextStep} />;
      case "core_likert":
        return <CoreLikert onNext={nextStep} onPrev={prevStep} />;
      case "core_evidence":
        return <CoreEvidence onNext={nextStep} onPrev={prevStep} />;
      case "bigfive":
        return <BigFive onNext={nextStep} onPrev={prevStep} />;
      case "ikigai":
        return <IkigaiWorksheet onNext={nextStep} onPrev={prevStep} />;
      case "plan90d":
        return <Plan90D onNext={nextStep} onPrev={prevStep} />;
      case "review":
        return (
          <Review
            onSubmit={nextStep}
            onPrev={prevStep}
            onGoToStep={(step) => goToStep(step as AssessmentStep)}
          />
        );
      case "submitted":
        return <Submitted onRestart={() => {
          resumeChecked.current = false;
          goToStep("welcome");
        }} />;
      default:
        return <Welcome onStart={nextStep} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {currentStep !== "welcome" && currentStep !== "submitted" && (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
          <div className="container max-w-3xl mx-auto px-4">
            <StepProgress
              steps={STEPS}
              currentStep={currentStep}
              stepLabels={STEP_LABELS}
              onStepClick={(step) => goToStep(step as AssessmentStep)}
            />
            {isAuthenticated && (
              <GlobalProgress className="pb-2" />
            )}
          </div>
        </div>
      )}
      <div className="container max-w-3xl mx-auto px-4 py-6">
        {renderStep()}
      </div>
    </div>
  );
}
