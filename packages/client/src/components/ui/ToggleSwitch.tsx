import clsx from 'clsx';

const thumb = (isOn: boolean) => (
  <div
    className={clsx(
      'absolute top-0.5 w-3 h-3 rounded-full bg-white flex items-center justify-center transition-transform',
      isOn ? 'translate-x-3.5' : 'translate-x-0.5',
    )}
  >
    {isOn && (
      <svg aria-hidden="true" width="8" height="8" viewBox="0 0 10 10" fill="none">
        <path
          d="M2 5L4 7L8 3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-toggle"
        />
      </svg>
    )}
  </div>
);

const pillClass = (isOn: boolean) =>
  clsx(
    'relative w-7 h-4 rounded-full transition-colors flex-shrink-0',
    isOn ? 'bg-toggle' : 'bg-white/20',
  );

/** When onClick is provided renders as an interactive button (role="switch").
 *  When used as a display-only indicator inside another button, omit onClick. */
export function ToggleSwitch({ isOn, onClick }: { isOn: boolean; onClick?: () => void }) {
  if (onClick) {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={isOn}
        onClick={onClick}
        className={pillClass(isOn)}
      >
        {thumb(isOn)}
      </button>
    );
  }
  return <div className={pillClass(isOn)}>{thumb(isOn)}</div>;
}
