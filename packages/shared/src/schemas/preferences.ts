import { z } from 'zod';

export const colorThemeSchema = z.enum(['dark', 'light']);
export type ColorTheme = z.infer<typeof colorThemeSchema>;

export const fontSizeSchema = z.enum(['sm', 'md', 'lg']);
export type FontSize = z.infer<typeof fontSizeSchema>;

export const densitySchema = z.enum(['comfortable', 'compact']);
export type Density = z.infer<typeof densitySchema>;

export const layoutSchema = z.enum(['a', 'b']);
export type Layout = z.infer<typeof layoutSchema>;

export const preferencesStateSchema = z.object({
  colorTheme: colorThemeSchema,
  fontSize: fontSizeSchema,
  density: densitySchema,
  layout: layoutSchema,
  hiddenItems: z.array(z.string()),
  isOnboardingDismissed: z.boolean(),
  isReviewUpsellDismissed: z.boolean(),
});
export type PreferencesState = z.infer<typeof preferencesStateSchema>;
