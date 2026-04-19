/** Icons used in the @ mention dropdown and related context-adding UI. */
export { DocumentIcon as FileIcon, FolderIcon } from '@heroicons/react/24/outline';

/** Custom folder-with-@-mark icon for "Add context from files" action. */
export function AddContextIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v6a2.25 2.25 0 01-2.25 2.25H4.5A2.25 2.25 0 012.25 18v-.75m0-5.25V5.25A2.25 2.25 0 014.5 3h3.879a2.25 2.25 0 011.591.659l1.682 1.682a2.25 2.25 0 001.59.659H19.5A2.25 2.25 0 0121.75 8.25V12"
      />
      <text
        x="12"
        y="16.5"
        textAnchor="middle"
        fontSize="8"
        fill="currentColor"
        fontFamily="monospace"
      >
        @
      </text>
    </svg>
  );
}
