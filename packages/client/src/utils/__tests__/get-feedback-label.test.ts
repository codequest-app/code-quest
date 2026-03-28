import { describe, expect, it } from 'vitest';
import { getFeedbackLabel } from '../feedback-label';

describe('getFeedbackLabel', () => {
  it('returns "Approved" for hook_callback continue: true', () => {
    expect(getFeedbackLabel({ continue: true })).toBe('Approved');
  });

  it('returns "Denied" for hook_callback continue: false', () => {
    expect(getFeedbackLabel({ continue: false })).toBe('Denied');
  });

  it('returns "Approved" for allow without updatedPermissions', () => {
    expect(getFeedbackLabel({ behavior: 'allow', updatedInput: {} })).toBe('Approved');
  });

  it('returns "Allowed Always" for allow with updatedPermissions', () => {
    expect(
      getFeedbackLabel({ behavior: 'allow', updatedInput: {}, updatedPermissions: [{}] }),
    ).toBe('Allowed Always');
  });

  it('returns "Denied" for deny without interrupt', () => {
    expect(getFeedbackLabel({ behavior: 'deny', message: 'no', interrupt: false })).toBe('Denied');
  });

  it('returns "Denied & Stopped" for deny with interrupt', () => {
    expect(getFeedbackLabel({ behavior: 'deny', message: 'no', interrupt: true })).toBe(
      'Denied & Stopped',
    );
  });
});
