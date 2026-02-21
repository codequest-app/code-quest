import { useState } from 'react';

interface ThinkingTokensInputProps {
  currentTokens?: number;
  onTokensChange?: (tokens: number) => void;
}

const PRESETS = [1024, 4096, 16384];

export function ThinkingTokensInput({ currentTokens, onTokensChange }: ThinkingTokensInputProps) {
  const [value, setValue] = useState<string>(currentTokens?.toString() ?? '');

  const handleChange = (newValue: string) => {
    setValue(newValue);
    const num = Number.parseInt(newValue, 10);
    if (!Number.isNaN(num) && num > 0) {
      onTokensChange?.(num);
    }
  };

  const handlePreset = (preset: number) => {
    setValue(preset.toString());
    onTokensChange?.(preset);
  };

  return (
    <div className="thinking-tokens-input" data-testid="thinking-tokens-input">
      <input
        type="number"
        className="tokens-number-input"
        data-testid="tokens-number-input"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        min={1}
        placeholder="Tokens"
      />
      {PRESETS.map((preset) => (
        <button
          key={preset}
          type="button"
          className="tokens-preset-btn"
          data-testid={`tokens-preset-${preset}`}
          onClick={() => handlePreset(preset)}
        >
          {preset}
        </button>
      ))}
      <style>{`
        .thinking-tokens-input {
          display: flex;
          gap: 4px;
          align-items: center;
        }
        .tokens-number-input {
          width: 64px;
          background: rgba(255, 255, 255, 0.15);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 3px;
          padding: 1px 4px;
          font-size: 12px;
        }
        .tokens-preset-btn {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 3px;
          padding: 1px 6px;
          font-size: 11px;
          cursor: pointer;
        }
        .tokens-preset-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
