import { validateName } from './validate-name.ts';

const MAX_NAME_LENGTH = 100;
const VALID_NAME_RE = /^[a-zA-Z0-9._-]+$/;

export function validateWorktreeName(name: string): string | null {
  return validateName(
    name,
    MAX_NAME_LENGTH,
    VALID_NAME_RE,
    'Only letters, numbers, dots, hyphens, and underscores allowed',
  );
}
