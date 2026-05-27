function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object';
}

export function isInitialPasswordChangeRequired(user: unknown): boolean {
  return isRecord(user) && user.initPwdRequired === true;
}

export function hasInitialPasswordRequirementSignal(user: unknown): boolean {
  return isRecord(user) && typeof user.initPwdRequired === 'boolean';
}

export function getAuthResponseData(payload: unknown): Record<string, unknown> | undefined {
  if (!isRecord(payload) || !isRecord(payload.data)) {
    return undefined;
  }

  return payload.data;
}
