/** Thinking-level value `'off'` means user disabled it; `'disabled'` means
 *  the current model doesn't support adaptive thinking. Both render and
 *  toggle paths treat these as "not active". */
export function isThinkingActive(level: string | undefined | null): boolean {
  return !!level && level !== 'off' && level !== 'disabled';
}
