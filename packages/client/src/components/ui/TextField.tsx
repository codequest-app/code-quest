import type { ChangeEvent, Ref } from 'react';
import { cn } from '../../utils/cn';
import { controlBorder, focusRing } from './_tokens';

const BASE = cn(
  'bg-input-overlay rounded px-2 py-1 text-text placeholder:text-text-muted text-sm',
  controlBorder,
  // Keep border-color shift on focus for backwards visual compat; layer
  // the shared focus ring on top so keyboard focus is unmistakable.
  'focus:outline-none focus:border-accent/50',
  focusRing,
);

type CommonProps = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
};

type InputProps = CommonProps & {
  as?: 'input';
  inputRef?: Ref<HTMLInputElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  autoFocus?: boolean;
  type?: 'text' | 'password' | 'email' | 'url';
};

type TextareaProps = CommonProps & {
  as: 'textarea';
  inputRef?: Ref<HTMLTextAreaElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLTextAreaElement>;
  rows?: number;
  autoFocus?: boolean;
};

type TextFieldProps = InputProps | TextareaProps;

export function TextField(props: TextFieldProps): React.JSX.Element {
  const merged = cn(BASE, props.className);
  if (props.as === 'textarea') {
    const { inputRef, onChange, as: _as, className: _className, ...rest } = props;
    return (
      <textarea
        ref={inputRef}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        className={merged}
        {...rest}
      />
    );
  }
  const { inputRef, onChange, type = 'text', as: _as, className: _className, ...rest } = props;
  return (
    <input
      ref={inputRef}
      type={type}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      className={merged}
      {...rest}
    />
  );
}
