import { useCallback, useEffect, useState } from 'react';

interface RPGQuestionModalProps {
  question: string;
  options: string[];
  onSelect: (index: number) => void;
}

export function RPGQuestionModal({ question, options, onSelect }: RPGQuestionModalProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
          break;
        case 'Enter':
          e.preventDefault();
          onSelect(selectedIndex);
          break;
      }
    },
    [options.length, selectedIndex, onSelect],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="rpg-question-modal" data-testid="rpg-question-modal">
      <div className="question-text">{question}</div>
      <ul className="question-options">
        {options.map((option, index) => (
          <li
            key={option}
            className={`question-option ${index === selectedIndex ? 'selected' : ''}`}
            data-testid={`question-option-${index}`}
          >
            <span className="option-cursor">{index === selectedIndex ? '▶' : ' '}</span>
            <span>{option}</span>
          </li>
        ))}
      </ul>

      <style>{`
        .rpg-question-modal {
          position: absolute;
          bottom: 80px;
          left: 50%;
          transform: translateX(-50%);
          min-width: 300px;
          max-width: 500px;
          background: #1a1a2e;
          border: 2px solid #ffd54f;
          border-radius: 4px;
          padding: 16px;
          font-family: 'Courier New', monospace;
          color: #fff;
          z-index: 20;
        }

        .question-text {
          font-size: 16px;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #555;
        }

        .question-options {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .question-option {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 8px;
          cursor: pointer;
          font-size: 14px;
        }

        .question-option.selected {
          background: rgba(255, 213, 79, 0.15);
          color: #ffd54f;
        }

        .option-cursor {
          width: 16px;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}
