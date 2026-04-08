export function ProjectCard({
  name,
  active,
  onSelect,
}: {
  name: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`mx-2 my-1 px-3 py-2 rounded cursor-pointer text-sm text-left w-[calc(100%-16px)] ${
        active
          ? 'border border-accent bg-accent/10 text-text'
          : 'border border-transparent hover:bg-white/5 text-text-muted'
      }`}
      onClick={onSelect}
    >
      📁 {name}
    </button>
  );
}
