import { z } from 'zod';

export const colorThemeSchema = z.enum(['dark', 'light', 'system']);
export type ColorTheme = z.infer<typeof colorThemeSchema>;

/** Concrete theme after resolving 'system' via OS preference; used as
 *  DOM data-theme value and by non-CSS consumers (e.g. Prism syntax theme). */
export type EffectiveColorTheme = 'dark' | 'light';

export const fontSizeSchema = z.enum(['sm', 'md', 'lg']);
export type FontSize = z.infer<typeof fontSizeSchema>;

export const densitySchema = z.enum(['comfortable', 'compact']);
export type Density = z.infer<typeof densitySchema>;

export const preferencesStateSchema = z.object({
  colorTheme: colorThemeSchema,
  fontSize: fontSizeSchema,
  density: densitySchema,
  hiddenItems: z.array(z.string()),
});
export type PreferencesState = z.infer<typeof preferencesStateSchema>;

/** Canonical IDs pushed into `hiddenItems` by dismissible UI. */
export const DISMISSIBLE_IDS = {
  onboardingOverlay: 'onboarding-overlay',
  reviewUpsellBanner: 'banner-review-upsell',
} as const;
