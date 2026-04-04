import { useRef, useState } from 'react';

interface Option {
  label: string;
  description: string;
}

export interface Question {
  question: string;
  header: string;
  options: Option[];
  multiSelect: boolean;
}

export function QuestionContent({
  questions,
  onAnswersChange,
}: {
  questions: Question[];
  onAnswersChange: (answers: Record<string, string>, allAnswered: boolean) => void;
}) {
  const [activeTab, setActiveTab] = useState(0);
  const [selections, setSelections] = useState<Record<string, Set<string>>>({});
  const [otherTexts, setOtherTexts] = useState<Record<string, string>>({});
  const otherInputRef = useRef<HTMLInputElement>(null);

  const checkAllAnswered = (
    newSelections: Record<string, Set<string>>,
    newOtherTexts: Record<string, string>,
  ) => {
    const allAnswered = questions.every((q) => {
      const sel = newSelections[q.question];
      if (!sel || sel.size === 0) return false;
      if (sel.has('Other') && !(newOtherTexts[q.question] ?? '').trim()) return false;
      return true;
    });
    const answers = Object.fromEntries(
      questions.map((q) => {
        const sel = newSelections[q.question];
        if (!sel || sel.size === 0) return [q.question, ''];
        if (sel.has('Other')) {
          const otherText = newOtherTexts[q.question] ?? '';
          if (q.multiSelect) {
            const normal = [...sel].filter((s) => s !== 'Other');
            return [q.question, [...normal, otherText].filter(Boolean).join(', ')];
          }
          return [q.question, otherText];
        }
        return [q.question, [...sel].join(', ')];
      }),
    );
    onAnswersChange(answers, allAnswered);
  };

  const handleSelect = (questionText: string, value: string, multiSelect: boolean) => {
    setSelections((prev) => {
      const current = prev[questionText] ?? new Set<string>();
      const next = new Set(current);
      if (multiSelect) {
        if (next.has(value)) next.delete(value);
        else next.add(value);
      } else {
        next.clear();
        next.add(value);
      }
      const updated = { ...prev, [questionText]: next };
      checkAllAnswered(updated, otherTexts);

      if (value === 'Other') {
        setTimeout(() => otherInputRef.current?.focus(), 0);
      }
      return updated;
    });
  };

  const handleOtherText = (questionText: string, text: string) => {
    const updated = { ...otherTexts, [questionText]: text };
    setOtherTexts(updated);
    checkAllAnswered(selections, updated);
  };

  const currentQuestion = questions[activeTab];
  if (!currentQuestion) return null;

  const isSelected = (label: string) => selections[currentQuestion.question]?.has(label) ?? false;

  return (
    <div>
      {/* Tab navigation */}
      <div className="flex items-center gap-2.5 mb-3 -mt-1" role="tablist">
        {questions.map((q, i) => {
          const isActive = i === activeTab;
          const isAnswered = (selections[q.question]?.size ?? 0) > 0;
          return (
            <button
              key={q.header}
              type="button"
              role="tab"
              aria-label={q.header}
              aria-selected={isActive}
              data-answered={isAnswered ? 'true' : undefined}
              onClick={() => setActiveTab(i)}
              className={`text-xs font-medium bg-transparent border-0 border-b-2 cursor-pointer px-0.5 py-1 min-w-0 truncate ${
                isActive
                  ? 'text-text border-accent'
                  : isAnswered
                    ? 'text-text-muted border-transparent'
                    : 'text-text border-transparent'
              }`}
            >
              {q.header}
            </button>
          );
        })}
      </div>

      {/* Current question */}
      <div className="text-sm font-medium text-text mb-2">{currentQuestion.question}</div>

      {/* Options */}
      <div className="flex flex-col gap-1">
        {currentQuestion.options.map((opt) => (
          // biome-ignore lint/a11y/noStaticElementInteractions: matches extension — div with role
          // biome-ignore lint/a11y/useAriaPropsSupportedByRole: dynamic role checkbox/radio
          <div
            key={opt.label}
            role={currentQuestion.multiSelect ? 'checkbox' : 'radio'}
            aria-checked={isSelected(opt.label)}
            tabIndex={0}
            onClick={() =>
              handleSelect(currentQuestion.question, opt.label, currentQuestion.multiSelect)
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelect(currentQuestion.question, opt.label, currentQuestion.multiSelect);
              }
            }}
            className={`flex items-start gap-2 px-2 py-1.5 rounded cursor-pointer text-xs ${
              isSelected(opt.label) ? 'bg-accent/10' : 'hover:bg-white/5'
            }`}
          >
            <div className="mt-0.5 flex-shrink-0">
              {currentQuestion.multiSelect ? (
                <div
                  className={`w-3.5 h-3.5 rounded-sm border ${isSelected(opt.label) ? 'bg-accent border-accent' : 'border-text-muted/40'} flex items-center justify-center`}
                >
                  {isSelected(opt.label) && (
                    <svg aria-hidden="true" width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6L5 9L10 3"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              ) : (
                <div
                  className={`w-3.5 h-3.5 rounded-full border ${isSelected(opt.label) ? 'border-accent' : 'border-text-muted/40'} flex items-center justify-center`}
                >
                  {isSelected(opt.label) && <div className="w-2 h-2 rounded-full bg-accent" />}
                </div>
              )}
            </div>
            <div>
              <div className="text-text">{opt.label}</div>
              {opt.description && (
                <div className="text-text-muted text-[11px]">{opt.description}</div>
              )}
            </div>
          </div>
        ))}

        {/* Other option */}
        {/* biome-ignore lint/a11y/noStaticElementInteractions: matches extension */}
        {/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: dynamic role */}
        <div
          role={currentQuestion.multiSelect ? 'checkbox' : 'radio'}
          aria-checked={isSelected('Other')}
          tabIndex={0}
          onClick={() =>
            handleSelect(currentQuestion.question, 'Other', currentQuestion.multiSelect)
          }
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleSelect(currentQuestion.question, 'Other', currentQuestion.multiSelect);
            }
          }}
          className={`flex items-start gap-2 px-2 py-1.5 rounded cursor-pointer text-xs ${
            isSelected('Other') ? 'bg-accent/10' : 'hover:bg-white/5'
          }`}
        >
          <div className="mt-0.5 flex-shrink-0">
            {currentQuestion.multiSelect ? (
              <div
                className={`w-3.5 h-3.5 rounded-sm border ${isSelected('Other') ? 'bg-accent border-accent' : 'border-text-muted/40'} flex items-center justify-center`}
              >
                {isSelected('Other') && (
                  <svg aria-hidden="true" width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 6L5 9L10 3"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            ) : (
              <div
                className={`w-3.5 h-3.5 rounded-full border ${isSelected('Other') ? 'border-accent' : 'border-text-muted/40'} flex items-center justify-center`}
              >
                {isSelected('Other') && <div className="w-2 h-2 rounded-full bg-accent" />}
              </div>
            )}
          </div>
          <div className="text-text">Other</div>
        </div>

        {isSelected('Other') && (
          <input
            ref={otherInputRef}
            type="text"
            placeholder="Type your answer..."
            value={otherTexts[currentQuestion.question] ?? ''}
            onChange={(e) => handleOtherText(currentQuestion.question, e.target.value)}
            className="text-xs bg-black/20 rounded px-2 py-1 text-text border border-white/10 ml-6"
          />
        )}
      </div>
    </div>
  );
}
