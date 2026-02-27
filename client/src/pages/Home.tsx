import { useAuth } from "@/_core/hooks/useAuth";
import { useAssessment } from "@/hooks/useAssessment";
import { StepProgress } from "@/components/StepProgress";
import Welcome from "./Welcome";
import CoreLikert from "./CoreLikert";
import CoreEvidence from "./CoreEvidence";
import BigFive from "./BigFive";
import IkigaiWorksheet from "./IkigaiWorksheet";
import Review from "./Review";
import Submitted from "./Submitted";
import type { AssessmentStep } from "@/hooks/useAssessment";

export default function Home() {
  const { user, loading } = useAuth();
  const {
    currentStep,
    steps,
    stepLabels,
    goToStep,
    nextStep,
    prevStep,
  } = useAssessment();

  if (loading) {
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
      case "review":
        return (
          <Review
            onSubmit={nextStep}
            onPrev={prevStep}
            onGoToStep={(step) => goToStep(step as AssessmentStep)}
          />
        );
      case "submitted":
        return <Submitted />;
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
              steps={steps}
              currentStep={currentStep}
              stepLabels={stepLabels}
              onStepClick={(step) => goToStep(step)}
            />
          </div>
        </div>
      )}
      <div className="container max-w-3xl mx-auto px-4 py-6">
        {renderStep()}
      </div>
    </div>
  );
}
