import { useState } from 'react';
import { usePreferencesStore } from '../stores/usePreferencesStore';
import { Dialog, DialogContent } from './ui/Dialog';

const STEPS = [
  {
    title: 'Welcome',
    description: 'Welcome to Code Quest! This walkthrough will help you get started.',
  },
  {
    title: 'Open Chat',
    description:
      'Use the chat panel to communicate with Claude. Type your message in the input box below.',
  },
  {
    title: 'Send Message',
    description:
      'Press Enter or click Send to submit your message. Claude will stream a response in real time.',
  },
  {
    title: 'History',
    description: 'Click the History button in the header to browse and resume previous sessions.',
  },
];

export function OnboardingOverlay() {
  const { isOnboardingDismissed, dismissOnboarding } = usePreferencesStore();
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  if (isOnboardingDismissed) return null;

  return (
    <Dialog open onOpenChange={(open) => !open && dismissOnboarding()}>
      <DialogContent title="Onboarding" hideTitle className="max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-text-muted">
            Step {step + 1} of {STEPS.length}
          </span>
          <button
            type="button"
            onClick={dismissOnboarding}
            className="text-xs text-text-muted hover:text-text cursor-pointer"
          >
            Skip
          </button>
        </div>
        <h3 className="text-lg font-semibold text-text mb-2">{current.title}</h3>
        <p className="text-sm text-text-muted mb-6">{current.description}</p>
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="px-3 py-1.5 text-sm text-text-muted hover:text-text disabled:opacity-30 cursor-pointer disabled:cursor-default"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => (isLast ? dismissOnboarding() : setStep((s) => s + 1))}
            className="px-4 py-1.5 text-sm bg-accent text-white rounded-md cursor-pointer hover:bg-accent/80"
          >
            {isLast ? 'Done' : 'Next'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
