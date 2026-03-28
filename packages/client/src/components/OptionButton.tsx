export function OptionButton({
  index,
  label,
  selected = false,
  onClick,
  onMouseEnter,
}: {
  index: number;
  label: string;
  selected?: boolean;
  onClick: () => void;
  onMouseEnter?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`w-full text-left px-4 py-2 text-xs flex items-center gap-2 cursor-pointer transition-colors ${selected ? 'bg-accent text-white' : 'hover:bg-white/5'}`}
    >
      <span
        className={`w-4 text-center flex-shrink-0 ${selected ? 'text-white' : 'text-text-muted'}`}
      >
        {index}
      </span>
      <span>{label}</span>
    </button>
  );
}
