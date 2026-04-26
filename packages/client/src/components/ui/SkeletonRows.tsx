/** Animated placeholder rows for list-shaped loading states (Spec sections,
 *  FileTree root). Conveys "content of similar shape is loading" without
 *  needing visible text. */
export function SkeletonRows({ count = 3 }: { count?: number }) {
  return (
    <div
      role="status"
      className="flex flex-col gap-1.5 px-1 py-1"
      aria-busy="true"
      aria-label="Loading"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: cosmetic placeholders, no semantic identity
          key={i}
          className="h-4 bg-text/10 rounded animate-pulse"
          // Vary widths so it doesn't look like a perfect 3-bar bar chart.
          style={{ width: `${55 + ((i * 17) % 35)}%` }}
        />
      ))}
    </div>
  );
}
