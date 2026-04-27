import { describe, expect, it } from 'vitest';
import { readSrc } from '../test/read-src';

const appCss = readSrc('App.css');
const chatInputAreaSrc = readSrc('components/ChatInputArea.tsx');
const composeToolbarSrc = readSrc('components/ComposeToolbar.tsx');

const hoverTintConsumers = {
  IconButton: readSrc('components/ui/IconButton.tsx'),
  PermissionModePicker: readSrc('components/PermissionModePicker.tsx'),
  AttachMenu: readSrc('components/AttachMenu.tsx'),
  ReviewUpsellBanner: readSrc('components/ReviewUpsellBanner.tsx'),
  MentionDropdown: readSrc('components/MentionDropdown.tsx'),
  ModelPickerPopover: readSrc('components/ModelPickerPopover.tsx'),
  CommandMenu: readSrc('components/command-menu/CommandMenu.tsx'),
  // EffortSwitch intentionally uses `bg-white` for the slider thumb — a
  // theme-invariant affordance on the colored `bg-toggle` fill. Excluded
  // from the hover-tint consumer list for that reason.
} as const;

function extractBlock(selector: RegExp): string {
  return appCss.match(selector)?.[1] ?? '';
}

const themeBlock = extractBlock(/@theme\s*\{([\s\S]*?)\n\}/);
const darkBlock = extractBlock(/:root\[data-theme="dark"\]\s*\{([\s\S]*?)\n\}/);
const lightBlock = extractBlock(/:root\[data-theme="light"\]\s*\{([\s\S]*?)\n\}/);

describe('App.css static shape', () => {
  describe('T1 — chat-input-* token removal', () => {
    it('does not declare --color-chat-input-bg', () => {
      expect(appCss).not.toMatch(/--color-chat-input-bg\b/);
    });
    it('does not declare --color-chat-input-border', () => {
      expect(appCss).not.toMatch(/--color-chat-input-border\b/);
    });
  });

  describe('T2 — tint utilities (theme-adaptive overlay)', () => {
    it('declares @utility tint-5', () => {
      expect(appCss).toMatch(/@utility\s+tint-5\s*\{[^}]*--color-hover-tint-rgb[^}]*0\.05/);
    });
    it('declares @utility tint-10', () => {
      expect(appCss).toMatch(/@utility\s+tint-10\s*\{[^}]*--color-hover-tint-rgb[^}]*0\.1\b/);
    });
    it('does not declare the old hover-tint-* names', () => {
      expect(appCss).not.toMatch(/@utility\s+hover-tint-/);
    });
  });

  describe('T3 — permission-mode global visual CSS removed', () => {
    it('does not contain .send-btn rule', () => {
      expect(appCss).not.toMatch(/\.send-btn\b/);
    });
    it('does not contain [data-permission-mode=...]:focus-within selector', () => {
      expect(appCss).not.toMatch(/\[data-permission-mode="[^"]+"\]:focus-within/);
    });
    it('does not contain hardcoded accent/button/text rgb values', () => {
      expect(appCss).not.toMatch(/rgba\(\s*217\s*,\s*119\s*,\s*87\s*,\s*0\.2\s*\)/);
      expect(appCss).not.toMatch(/rgba\(\s*0\s*,\s*127\s*,\s*212\s*,\s*0\.2\s*\)/);
      expect(appCss).not.toMatch(/rgba\(\s*204\s*,\s*204\s*,\s*204\s*,\s*0\.1\s*\)/);
    });
  });

  describe('T4 — rgb-split tokens', () => {
    it('@theme declares --color-button-rgb (dark default)', () => {
      expect(themeBlock).toMatch(/--color-button-rgb:\s*0\s*,\s*120\s*,\s*212/);
    });
    it('@theme declares --color-text-rgb (dark default)', () => {
      expect(themeBlock).toMatch(/--color-text-rgb:\s*204\s*,\s*204\s*,\s*204/);
    });
    it('[data-theme="dark"] re-declares button/text rgb to dark values', () => {
      expect(darkBlock).toMatch(/--color-button-rgb:\s*0\s*,\s*120\s*,\s*212/);
      expect(darkBlock).toMatch(/--color-text-rgb:\s*204\s*,\s*204\s*,\s*204/);
    });
    it('[data-theme="light"] declares button/text rgb with light values', () => {
      expect(lightBlock).toMatch(/--color-button-rgb:\s*0\s*,\s*90\s*,\s*158/);
      expect(lightBlock).toMatch(/--color-text-rgb:\s*31\s*,\s*31\s*,\s*31/);
    });
  });

  describe('T5 — mode → CSS var dispatch', () => {
    const modes = [
      ['normal', /--color-claude-clay-orange/, '0.2'],
      ['plan', /--color-button\b/, '0.2'],
      ['acceptEdits', /--color-text\b/, '0.1'],
      ['bypassPermissions', /--color-danger/, '0'],
      ['auto', /--color-danger/, '0'],
    ] as const;

    for (const [mode, accentRef, shadowAlpha] of modes) {
      it(`declares --mode-accent + --mode-shadow-alpha=${shadowAlpha} for data-mode="${mode}"`, () => {
        const block = extractBlock(
          new RegExp(`\\[data-mode="${mode}"\\][^{]*\\{([\\s\\S]*?)\\n\\}`),
        );
        expect(block).toMatch(accentRef);
        expect(block).toMatch(new RegExp(`--mode-shadow-alpha:\\s*${shadowAlpha}\\b`));
      });
    }
  });
});

describe('T2 tint consumers use theme tokens (no bg-white*, no hover-tint-*)', () => {
  for (const [name, src] of Object.entries(hoverTintConsumers)) {
    it(`${name}.tsx is hardcode-free`, () => {
      expect(src).not.toMatch(/\bbg-white(?:\/\d+)?\b/);
      expect(src).not.toMatch(/hover-tint-/);
    });
  }
});

describe('T1 ChatInputArea uses surface/border tokens', () => {
  it('uses bg-surface + border-border', () => {
    expect(chatInputAreaSrc).toMatch(/bg-surface\b/);
    expect(chatInputAreaSrc).toMatch(/border-border\b/);
    expect(chatInputAreaSrc).not.toMatch(/(bg|border)-chat-input-/);
  });
  it('outer div has data-mode attribute derived from permissionMode', () => {
    expect(chatInputAreaSrc).toMatch(/data-mode=\{toPermissionMode\(permissionMode\)\}/);
  });
  it('uses CSS-var dispatch instead of per-mode focus-within variants', () => {
    expect(chatInputAreaSrc).toMatch(/focus-within:border-\[var\(--mode-accent\)\]/);
    expect(chatInputAreaSrc).toMatch(
      /focus-within:shadow-\[0_1px_2px_rgba\(var\(--mode-accent-rgb\),\s*var\(--mode-shadow-alpha/,
    );
    expect(chatInputAreaSrc).not.toMatch(/focus-within:data-\[mode=/);
  });
});

describe('T3 ComposeToolbar send button uses data-mode + CSS var dispatch', () => {
  it('has no send-btn legacy class', () => {
    expect(composeToolbarSrc).not.toMatch(/\bsend-btn\b/);
  });
  it('has no per-mode bg constants', () => {
    expect(composeToolbarSrc).not.toMatch(/SEND_BTN_MODE_CLASSES/);
    expect(composeToolbarSrc).not.toMatch(/SEND_BTN_CLASS_/);
    expect(composeToolbarSrc).not.toMatch(/data-\[mode=[a-zA-Z]+\]:bg-/);
  });
  it('extracted SendButton renders bg-[var(--mode-accent)] and data-mode from its prop', () => {
    expect(composeToolbarSrc).toMatch(/function SendButton\(/);
    expect(composeToolbarSrc).toMatch(/data-mode=\{mode\}/);
    expect(composeToolbarSrc).toMatch(/bg-\[var\(--mode-accent\)\]/);
  });
});
