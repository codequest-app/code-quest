import type { Question } from '@code-quest/shared';
import { useRef, useState } from 'react';
import { cn } from '../utils/cn';

function CheckIndicator({ checked }: { checked: boolean }) {
  return (
    <div
      className={cn(
        'w-3.5 h-3.5 rounded-sm border flex items-center justify-center',
        checked ? 'bg-accent border-accent' : 'border-text-muted/40',
      )}
    >
      {checked && (
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
  );
}

function RadioIndicator({ checked }: { checked: boolean }) {
  return (
    <div
      className={cn(
        'w-3.5 h-3.5 rounded-full border flex items-center justify-center',
        checked ? 'border-accent' : 'border-text-muted/40',
      )}
    >
      {checked && <div className="w-2 h-2 rounded-full bg-accent" />}
    </div>
  );
}

function OptionItem({
  label,
  description,
  selected,
  multiSelect,
  onSelect,
  onKeySelect,
}: {
  label: string;
  description?: string;
  selected: boolean;
  multiSelect: boolean;
  onSelect: () => void;
  onKeySelect: (e: React.KeyboardEvent) => void;
}) {
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: matches extension — div with role
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: dynamic role checkbox/radio
    <div
      role={multiSelect ? 'checkbox' : 'radio'}
      aria-checked={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={onKeySelect}
      className={cn(
        'flex items-start gap-2 px-2 py-1.5 rounded cursor-pointer text-xs',
        selected ? 'bg-accent/10' : 'hover:bg-white/5',
      )}
    >
      <div className="mt-0.5 flex-shrink-0">
        {multiSelect ? (
          <CheckIndicator checked={selected} />
        ) : (
          <RadioIndicator checked={selected} />
        )}
      </div>
      <div>
        <div className="text-text">{label}</div>
        {description && <div className="text-text-muted text-[11px]">{description}</div>}
      </div>
    </div>
  );
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

  function notifyAnswers(
    nextSelections: Record<string, Set<string>>,
    nextOtherTexts: Record<string, string>,
  ) {
    const allAnswered = questions.every((q) => {
      const sel = nextSelections[q.question];
      if (!sel || sel.size === 0) return false;
      if (sel.has('Other') && !(nextOtherTexts[q.question] ?? '').trim()) return false;
      return true;
    });
    const answers = Object.fromEntries(
      questions.map((q) => {
        const sel = nextSelections[q.question];
        if (!sel || sel.size === 0) return [q.question, ''];
        if (sel.has('Other')) {
          const other = nextOtherTexts[q.question] ?? '';
          if (q.multiSelect) {
            const normal = [...sel].filter((s) => s !== 'Other');
            return [q.question, [...normal, other].filter(Boolean).join(', ')];
          }
          return [q.question, other];
        }
        return [q.question, [...sel].join(', ')];
      }),
    );
    onAnswersChange(answers, allAnswered);
  }

  const handleSelect = (questionText: string, value: string, multiSelect: boolean) => {
    const current = selections[questionText] ?? new Set<string>();
    const next = new Set(current);
    if (multiSelect) {
      if (next.has(value)) next.delete(value);
      else next.add(value);
    } else {
      next.clear();
      next.add(value);
    }
    if (value === 'Other') {
      setTimeout(() => otherInputRef.current?.focus(), 0);
    }
    const nextSelections = { ...selections, [questionText]: next };
    setSelections(nextSelections);
    notifyAnswers(nextSelections, otherTexts);
  };

  const handleOtherText = (questionText: string, text: string) => {
    const nextOtherTexts = { ...otherTexts, [questionText]: text };
    setOtherTexts(nextOtherTexts);
    notifyAnswers(selections, nextOtherTexts);
  };

  const currentQuestion = questions[activeTab];
  if (!currentQuestion) return null;

  const isSelected = (label: string) => selections[currentQuestion.question]?.has(label) ?? false;

  const handleKeySelect = (value: string) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(currentQuestion.question, value, currentQuestion.multiSelect);
    }
  };

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
              className={cn(
                'text-xs font-medium bg-transparent border-0 border-b-2 cursor-pointer px-0.5 py-1 min-w-0 truncate',
                isActive ? 'text-text border-accent' : 'text-text-muted border-transparent',
              )}
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
          <OptionItem
            key={opt.label}
            label={opt.label}
            description={opt.description}
            selected={isSelected(opt.label)}
            multiSelect={currentQuestion.multiSelect}
            onSelect={() =>
              handleSelect(currentQuestion.question, opt.label, currentQuestion.multiSelect)
            }
            onKeySelect={handleKeySelect(opt.label)}
          />
        ))}

        {/* Other option */}
        <OptionItem
          label="Other"
          selected={isSelected('Other')}
          multiSelect={currentQuestion.multiSelect}
          onSelect={() =>
            handleSelect(currentQuestion.question, 'Other', currentQuestion.multiSelect)
          }
          onKeySelect={handleKeySelect('Other')}
        />

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
