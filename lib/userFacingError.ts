/** Keep implementation details in server logs, never in normal workflow responses. */
export function userFacingError(detail: unknown): string {
  console.error('Workflow request failed:', detail);
  return "We couldn't complete this action. Please try again. If the problem continues, contact Opus Care.";
}
