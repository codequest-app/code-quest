import { CheckIcon } from '@heroicons/react/16/solid';
import * as RadixCheckbox from '@radix-ui/react-checkbox';
import { useId } from 'react';
import { cn } from '@/utils/cn';
import { slugify } from '@/utils/slugify';
import { focusRing } from './_tokens.ts';

export function Checkbox({
  id: idProp,
  checked,
  onCheckedChange,
  label,
  className,
}: {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}): React.JSX.Element {
  const autoId = useId();
  const id = idProp ?? (label ? `checkbox-${slugify(label)}` : autoId);

  const root = (
    <RadixCheckbox.Root
      id={id}
      checked={checked}
      onCheckedChange={(val) => onCheckedChange(val === true)}
      className={cn(
        'w-3.5 h-3.5 shrink-0 rounded-sm border border-border bg-transparent',
        'flex items-center justify-center',
        'data-[state=checked]:bg-accent data-[state=checked]:border-accent',
        focusRing,
        className,
      )}
    >
      <RadixCheckbox.Indicator>
        <CheckIcon aria-hidden="true" className="w-3 h-3 text-white" />
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  );

  if (!label) return root;

  return (
    <label htmlFor={id} className="flex items-center gap-2 cursor-pointer select-none">
      {root}
      <span>{label}</span>
    </label>
  );
}
