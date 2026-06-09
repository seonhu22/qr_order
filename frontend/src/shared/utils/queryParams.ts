type QueryParamValue = string | number | boolean | null | undefined;

export function areQueryParamsEqual<T extends Record<string, QueryParamValue>>(
  left: T,
  right: T,
): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  return leftKeys.every((key) => left[key] === right[key]);
}
