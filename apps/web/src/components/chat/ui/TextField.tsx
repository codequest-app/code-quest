import type { InputHTMLAttributes, RefObject, TextareaHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

type TextFieldProps = {
  as?: 'input' | 'textarea';
  mono?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  onChange?: (value: string) => void;
  inputRef?: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
} & Omit<
  InputHTMLAttributes<HTMLInputElement> & TextareaHTMLAttributes<HTMLTextAreaElement>,
  'size' | 'onChange'
>;

export function TextField({
  as: As = 'input',
  mono = false,
  size = 'md',
  className,
  onChange,
  inputRef,
  ...rest
}: TextFieldProps): React.JSX.Element {
  const sizeClass = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';
  return (
    <As
      {...rest}
      // biome-ignore lint/suspicious/noExplicitAny: polymorphic element ref requires any
      ref={inputRef as any}
      onChange={
        onChange
          ? (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
              onChange(e.target.value)
          : undefined
      }
      className={cn(
        'bg-surface border border-border rounded text-text focus:border-accent focus:outline-none',
        sizeClass,
        mono && 'font-mono',
        className,
      )}
    />
  );
}
