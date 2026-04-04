import type { ControlPermissionResponse, Question } from '@code-quest/shared';
import { useState } from 'react';

const OTHER_VALUE = '__other__';
const OPTION_LABEL = 'flex items-start gap-2 text-sm cursor-pointer';

export interface AskUserQuestionBannerProps {
  input: Record<string, unknown>;
  questions: Question[];
  onRespond: (response: ControlPermissionResponse) => void;
}

export function AskUserQuestionBanner({ input, questions, onRespond }: AskUserQuestionBannerProps) {
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [otherTexts, setOtherTexts] = useState<Record<string, string>>({});

  const getAnswer = (q: Question): string => {
    const sel = selections[q.question] ?? [];
    if (sel.includes(OTHER_VALUE)) {
      const otherText = otherTexts[q.question] ?? '';
      if (q.multiSelect) {
        const normal = sel.filter((s) => s !== OTHER_VALUE);
        return [...normal, otherText].filter(Boolean).join(', ');
      }
      return otherText;
    }
    return sel.join(', ');
  };

  const allAnswered = questions.every((q) => {
    const sel = selections[q.question] ?? [];
    return (
      sel.length > 0 &&
      !(sel.includes(OTHER_VALUE) && (otherTexts[q.question] ?? '').trim().length === 0)
    );
  });

  const handleSubmit = () => {
    const answers = Object.fromEntries(questions.map((q) => [q.question, getAnswer(q)]));
    onRespond({
      behavior: 'allow',
      updatedInput: { ...input, answers },
    });
  };

  const handleChange = (
    question: string,
    value: string,
    multiSelect: boolean,
    checked: boolean,
  ) => {
    if (multiSelect) {
      setSelections((prev) => {
        const current = prev[question] ?? [];
        const next = checked ? [...current, value] : current.filter((v) => v !== value);
        return { ...prev, [question]: next };
      });
    } else {
      setSelections((prev) => ({ ...prev, [question]: [value] }));
    }
  };

  return (
    <div className="flex flex-col gap-3 bg-warning-bg border border-warning/30 rounded-md px-4 py-2.5">
      {questions.map((q) => {
        const sel = selections[q.question] ?? [];
        return (
          <div key={q.question} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold bg-warning/20 text-warning px-1.5 py-0.5 rounded">
                {q.header}
              </span>
              <span className="text-sm text-text-bright">{q.question}</span>
            </div>
            <div className="flex flex-col gap-1 pl-2">
              {q.options.map((opt) => {
                const inputType = q.multiSelect ? 'checkbox' : 'radio';
                const isChecked = q.multiSelect ? sel.includes(opt.label) : sel[0] === opt.label;
                return (
                  <label key={opt.label} className={OPTION_LABEL}>
                    <input
                      type={inputType}
                      name={q.question}
                      aria-label={opt.label}
                      checked={isChecked}
                      onChange={(e) =>
                        handleChange(q.question, opt.label, q.multiSelect, e.target.checked)
                      }
                      className="mt-0.5"
                    />
                    <span>
                      <span className="text-text-bright">{opt.label}</span>
                      <span className="text-text-muted ml-1">— {opt.description}</span>
                    </span>
                  </label>
                );
              })}
              {/* Other option */}
              <label className={OPTION_LABEL}>
                <input
                  type={q.multiSelect ? 'checkbox' : 'radio'}
                  name={q.question}
                  aria-label="Other"
                  checked={q.multiSelect ? sel.includes(OTHER_VALUE) : sel[0] === OTHER_VALUE}
                  onChange={(e) =>
                    handleChange(q.question, OTHER_VALUE, q.multiSelect, e.target.checked)
                  }
                  className="mt-0.5"
                />
                <span className="text-text-bright">Other</span>
              </label>
              {sel.includes(OTHER_VALUE) && (
                <input
                  type="text"
                  placeholder="Type your answer..."
                  value={otherTexts[q.question] ?? ''}
                  onChange={(e) =>
                    setOtherTexts((prev) => ({ ...prev, [q.question]: e.target.value }))
                  }
                  className="text-sm bg-black/20 rounded px-2 py-1 text-text border border-white/10 ml-6"
                />
              )}
            </div>
          </div>
        );
      })}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allAnswered}
          className="px-3 py-1.5 bg-success text-white rounded-md cursor-pointer text-[13px] font-medium transition-all hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Submit
        </button>
        <button
          type="button"
          onClick={() =>
            onRespond({ behavior: 'deny', message: 'User dismissed', interrupt: false })
          }
          className="px-3 py-1.5 bg-danger text-white rounded-md cursor-pointer text-[13px] font-medium transition-all hover:opacity-80"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
