import type { ControlPermissionResponse } from '@code-quest/shared';

export function getFeedbackLabel(response: ControlPermissionResponse): string {
  if ('continue' in response) {
    return response.continue ? 'Approved' : 'Denied';
  }
  if (response.behavior === 'allow') {
    return response.updatedPermissions ? 'Allowed Always' : 'Approved';
  }
  return response.interrupt ? 'Denied & Stopped' : 'Denied';
}
