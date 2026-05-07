import { DISMISSIBLE_IDS } from '@code-quest/shared';
import { Button } from '@/components/ui/Button';
import { useChannelConfig } from '@/contexts/channel';
import { usePreferencesStore } from '@/stores/usePreferencesStore';

export function ReviewUpsellBanner(): React.ReactNode {
  const { experimentGates } = useChannelConfig();
  const hiddenItems = usePreferencesStore((s) => s.hiddenItems);
  const hideItem = usePreferencesStore((s) => s.hideItem);
  const isDismissed = hiddenItems.includes(DISMISSIBLE_IDS.reviewUpsellBanner);
  const dismiss = () => hideItem(DISMISSIBLE_IDS.reviewUpsellBanner);
  const enabled = experimentGates.review_upsell === true;

  if (!enabled || isDismissed) return null;

  return (
    <section
      aria-label="review-upsell-banner"
      className="bg-accent/10 border border-accent/30 rounded-md px-4 py-3 flex items-center justify-between gap-3"
    >
      <span className="text-sm text-text">Try the new code review feature</span>
      <Button variant="ghost" size="xs" className="px-2 py-1" onClick={dismiss}>
        Dismiss
      </Button>
    </section>
  );
}
