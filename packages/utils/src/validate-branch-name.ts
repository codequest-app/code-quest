import { validateName } from './validate-name.ts';

const MAX_NAME_LENGTH = 255;
const VALID_NAME_RE = /^[\w./-]+$/;

export function validateBranchName(name: string): string | null {
  return validateName(
    name,
    MAX_NAME_LENGTH,
    VALID_NAME_RE,
    'Only letters, numbers, dots, hyphens, underscores, and slashes allowed',
  );
}
