import { Hero } from "../components/landing/Hero";
import { ProblemSection, SolutionSection } from "../components/landing/ProblemSolution";
import { HowItWorks, PrivacyArchitecture } from "../components/landing/HowItWorks";
import { CTA } from "../components/landing/CTA";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <ProblemSection />
      <SolutionSection />
      <HowItWorks />
      <PrivacyArchitecture />
      <CTA />
    </>
  );
}
