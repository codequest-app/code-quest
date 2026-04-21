/** Cross-module handshake: CommandMenu writes the current visible-item count
 *  here on each render; ComposeInput reads it to decide whether Enter should
 *  be captured by the palette or fall through to the submit path. Using a
 *  mutable singleton (vs context / signal) keeps the key handler synchronous
 *  and avoids coupling ComposeInput to the menu's React tree. */
export const slashPaletteState = { itemsCount: 0 };
