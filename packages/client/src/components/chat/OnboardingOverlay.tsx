import { DISMISSIBLE_IDS } from '@code-quest/shared';
import { useState } from 'react';
import { usePreferencesStore } from '@/stores/usePreferencesStore';
import { Button } from '../ui/Button.tsx';
import { Dialog, DialogContent } from '../ui/Dialog.tsx';
import { InlineAction } from '../ui/InlineAction.tsx';

function getSteps(brandName: string) {
  return [
    {
      title: 'Welcome',
      description: 'Welcome to Code Quest! This walkthrough will help you get started.',
    },
    {
      title: 'Open Chat',
      description: `Use the chat panel to communicate with ${brandName}. Type your message in the input box below.`,
    },
    {
      title: 'Send Message',
      description: `Press Enter or click Send to submit your message. ${brandName} will stream a response in real time.`,
    },
    {
      title: 'Resume',
      description:
        'Right-click a project in the sidebar to pick from past sessions, or use the command menu inside chat.',
    },
  ];
}

export function OnboardingOverlay(): React.ReactNode {
  const hiddenItems = usePreferencesStore((s) => s.hiddenItems);
  const hideItem = usePreferencesStore((s) => s.hideItem);
  const isOnboardingDismissed = hiddenItems.includes(DISMISSIBLE_IDS.onboardingOverlay);
  const dismissOnboarding = () => hideItem(DISMISSIBLE_IDS.onboardingOverlay);
  const [step, setStep] = useState(0);
  const steps = getSteps('Claude');
  const current = steps[step];
  const isLast = step === steps.length - 1;

  if (isOnboardingDismissed) return null;

  return (
    <Dialog open onOpenChange={(open) => !open && dismissOnboarding()}>
      <DialogContent title="Onboarding" hideTitle className="max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-text-muted">
            Step {step + 1} of {steps.length}
          </span>
          <InlineAction onClick={dismissOnboarding}>Skip</InlineAction>
        </div>
        <h3 className="text-lg font-semibold text-text mb-2">{current?.title}</h3>
        <p className="text-sm text-text-muted mb-6">{current?.description}</p>
        <div className="flex justify-between">
          <Button
            variant="ghost"
            size="md"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            Back
          </Button>
          <Button size="md" onClick={() => (isLast ? dismissOnboarding() : setStep((s) => s + 1))}>
            {isLast ? 'Done' : 'Next'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
