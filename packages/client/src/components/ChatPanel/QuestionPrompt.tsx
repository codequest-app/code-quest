import { useState } from 'react';
import type { AskUserQuestionData } from '../../stores/chatStore';

interface QuestionPromptProps {
  questions: AskUserQuestionData[];
  onAnswer: (answer: string) => void;
  onDismiss: () => void;
}

export function QuestionPrompt({ questions, onAnswer, onDismiss }: QuestionPromptProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<number, Set<string>>>({});
  const [otherInputs, setOtherInputs] = useState<Record<number, string>>({});
  const [showOther, setShowOther] = useState<Record<number, boolean>>({});

  const handleSingleSelect = (questionIdx: number, label: string) => {
    if (questions.length === 1) {
      onAnswer(label);
    } else {
      const updated = { ...selectedOptions };
      updated[questionIdx] = new Set([label]);
      setSelectedOptions(updated);
    }
  };

  const handleMultiToggle = (questionIdx: number, label: string) => {
    const updated = { ...selectedOptions };
    const current = new Set(updated[questionIdx] ?? []);
    if (current.has(label)) {
      current.delete(label);
    } else {
      current.add(label);
    }
    updated[questionIdx] = current;
    setSelectedOptions(updated);
  };

  const handleOtherSubmit = (questionIdx: number) => {
    const text = otherInputs[questionIdx]?.trim();
    if (text) {
      onAnswer(text);
    }
  };

  const handleMultiSubmit = () => {
    const allSelected = questions.map((_, idx) => {
      const selected = selectedOptions[idx];
      return selected ? Array.from(selected) : [];
    });
    const answer = allSelected.flat().join(', ');
    if (answer) {
      onAnswer(answer);
    }
  };

  const hasMultiSelect = questions.some((q) => q.multiSelect);

  return (
    <div className="question-prompt" data-testid="question-prompt">
      {questions.map((q, qIdx) => (
        <div key={`question-${q.question}`} className="question-block">
          {q.header && <div className="question-header">{q.header}</div>}
          <div className="question-text">{q.question}</div>
          <div className="question-options">
            {q.options.map((opt, optIdx) => {
              const isSelected = selectedOptions[qIdx]?.has(opt.label);
              return (
                <button
                  type="button"
                  key={opt.label}
                  className={`question-option-btn${isSelected ? ' selected' : ''}`}
                  data-testid={`question-option-${qIdx}-${optIdx}`}
                  onClick={() =>
                    q.multiSelect
                      ? handleMultiToggle(qIdx, opt.label)
                      : handleSingleSelect(qIdx, opt.label)
                  }
                >
                  <span className="option-label">{opt.label}</span>
                  {opt.description && <span className="option-description">{opt.description}</span>}
                </button>
              );
            })}
            <button
              type="button"
              className="question-option-btn question-other-btn"
              data-testid={`question-other-${qIdx}`}
              onClick={() => setShowOther((prev) => ({ ...prev, [qIdx]: !prev[qIdx] }))}
            >
              Other
            </button>
          </div>
          {showOther[qIdx] && (
            <div className="question-other-input">
              <input
                type="text"
                placeholder="Type your answer..."
                aria-label="Other answer"
                value={otherInputs[qIdx] ?? ''}
                onChange={(e) => setOtherInputs((prev) => ({ ...prev, [qIdx]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleOtherSubmit(qIdx);
                }}
              />
              <button
                type="button"
                className="question-btn question-btn-submit"
                data-testid={`question-other-submit-${qIdx}`}
                onClick={() => handleOtherSubmit(qIdx)}
              >
                Submit
              </button>
            </div>
          )}
        </div>
      ))}

      <div className="question-actions">
        {hasMultiSelect && (
          <button
            type="button"
            className="question-btn question-btn-submit"
            data-testid="question-multi-submit"
            onClick={handleMultiSubmit}
          >
            Submit
          </button>
        )}
        <button
          type="button"
          className="question-btn question-btn-dismiss"
          data-testid="question-dismiss"
          onClick={onDismiss}
        >
          Dismiss
        </button>
      </div>

      <style>{`
        .question-prompt {
          margin: 8px 12px;
          padding: 12px;
          background: #2d2d30;
          border: 1px solid #007acc;
          border-radius: 8px;
        }
        .question-block {
          margin-bottom: 8px;
        }
        .question-block:last-of-type {
          margin-bottom: 0;
        }
        .question-header {
          font-size: 11px;
          font-weight: 600;
          color: #007acc;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .question-text {
          font-size: 13px;
          color: #d4d4d4;
          margin-bottom: 8px;
        }
        .question-options {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 8px;
        }
        .question-option-btn {
          padding: 6px 12px;
          border: 1px solid #3e3e42;
          border-radius: 4px;
          background: #3e3e42;
          color: #d4d4d4;
          font-size: 12px;
          cursor: pointer;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .question-option-btn:hover {
          background: #4e4e52;
          border-color: #007acc;
        }
        .question-option-btn.selected {
          background: #264f78;
          border-color: #007acc;
        }
        .option-label {
          font-weight: 500;
        }
        .option-description {
          font-size: 11px;
          color: #9e9e9e;
        }
        .question-other-btn {
          color: #9e9e9e;
          font-style: italic;
        }
        .question-other-input {
          display: flex;
          gap: 6px;
          margin-top: 4px;
        }
        .question-other-input input {
          flex: 1;
          padding: 4px 8px;
          background: #1e1e1e;
          border: 1px solid #3e3e42;
          border-radius: 4px;
          color: #d4d4d4;
          font-size: 12px;
          outline: none;
        }
        .question-other-input input:focus {
          border-color: #007acc;
        }
        .question-actions {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }
        .question-btn {
          padding: 4px 12px;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }
        .question-btn-submit {
          background: #007acc;
          color: #fff;
        }
        .question-btn-dismiss {
          background: #3e3e42;
          color: #d4d4d4;
        }
      `}</style>
    </div>
  );
}
