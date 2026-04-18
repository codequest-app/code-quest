import { describe, expect, it, vi } from 'vitest';
import type { Feature } from '../../feature';
import { toSlashCommand } from '../to-slash-command';

describe('toSlashCommand', () => {
  it('returns null when feature has no slash binding', () => {
    const f: Feature = { id: 'a', label: 'A', category: 'X', execute: vi.fn() };
    expect(toSlashCommand(f)).toBeNull();
  });

  it('extracts command and invoke when slash is present', () => {
    const invoke = vi.fn();
    const match = vi.fn((m: string) => m.startsWith('/a'));
    const f: Feature = {
      id: 'a',
      label: 'A',
      category: 'X',
      execute: vi.fn(),
      slash: { command: '/a', match, invoke },
    };
    const out = toSlashCommand(f);
    expect(out?.command).toBe('/a');
    expect(out?.id).toBe('a');
    out?.invoke('/a arg');
    expect(invoke).toHaveBeenCalledWith('/a arg');
    expect(out?.match?.('/a hello')).toBe(true);
  });

  it('preserves id from feature not command', () => {
    const f: Feature = {
      id: 'btw',
      label: '/btw',
      category: 'X',
      execute: vi.fn(),
      slash: { command: '/btw', invoke: vi.fn() },
    };
    expect(toSlashCommand(f)?.id).toBe('btw');
  });
});
