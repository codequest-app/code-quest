/** Shared visual tokens for `ui/` primitives.
 *
 *  Centralizes recipes that previously drifted across components.
 *  Compose into a primitive's className via `cn(...)`.
 *
 *  Concerns covered: shape + state. Color palette stays in Tailwind
 *  theme tokens (bg-bg, text-text-*, accent, danger, ...).
 */

/** Single focus-visible recipe for all interactive primitives.
 *  ring-2 + accent matches the project's existing EffortSwitch baseline. */
export const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

/** Default control border. */
export const controlBorder = 'border border-border';
