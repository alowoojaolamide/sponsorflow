import { notFound } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export default function OnboardingStepPage({ params }: { params: { step: string } }) {
  const match = /^step-(\d{1,2})$/.exec(params.step);
  const step = match ? parseInt(match[1], 10) : NaN;

  if (!match || step < 1 || step > 10) {
    notFound();
  }

  return <OnboardingWizard step={step} />;
}
