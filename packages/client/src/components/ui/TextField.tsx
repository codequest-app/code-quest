import type { ChangeEvent, Ref } from 'react';
import { cn } from '../../utils/cn';

const BASE =
  'bg-input-overlay border border-border rounded px-2 py-1 text-text placeholder:text-text-muted text-sm focus:outline-none focus:border-accent/50';

type CommonProps = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  'data-testid'?: string;
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

export function TextField(props: TextFieldProps) {
  const merged = cn(BASE, props.className);
  if (props.as === 'textarea') {
    const { inputRef, onChange, as: _as, className: _cn, ...rest } = props;
    void _as;
    void _cn;
    return (
      <textarea
        ref={inputRef}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        className={merged}
        {...rest}
      />
    );
  }
  const { inputRef, onChange, type = 'text', as: _as, className: _cn, ...rest } = props;
  void _as;
  void _cn;
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
