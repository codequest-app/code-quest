import { useChannelMessages } from '../contexts/channel';
import { usePreferencesStore } from '../stores/usePreferencesStore';

export function ReviewUpsellBanner() {
  const { experimentGates } = useChannelMessages();
  const { isReviewUpsellDismissed: isDismissed, dismissReviewUpsell: dismiss } =
    usePreferencesStore();
  const enabled = experimentGates.review_upsell === true;

  if (!enabled || isDismissed) return null;

  return (
    <div
      data-testid="review-upsell-banner"
      className="bg-accent/10 border border-accent/30 rounded-md px-4 py-3 flex items-center justify-between gap-3"
    >
      <span className="text-sm text-text">Try the new code review feature</span>
      <button
        type="button"
        onClick={dismiss}
        className="text-xs text-text-muted hover:text-text px-2 py-1 rounded hover:bg-white/10"
      >
        Dismiss
      </button>
    </div>
  );
}
