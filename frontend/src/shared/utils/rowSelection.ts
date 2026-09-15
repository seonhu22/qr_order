type Identifiable = { id: string };

/**
 * 행삭제 후 선택할 다음 행의 id를 반환한다.
 *
 * @description
 * 삭제될 행의 다음 행이 있으면 해당 id를, 없으면(마지막 행 삭제) 이전 행의 id를 반환한다.
 * 둘 다 없으면(행이 1개뿐이었던 경우) 빈 문자열을 반환한다.
 */
export function getNextSelectedId<T extends Identifiable>(rows: T[], deletedId: string): string {
  const index = rows.findIndex((row) => row.id === deletedId);
  if (index === -1) return '';

  return rows[index + 1]?.id ?? rows[index - 1]?.id ?? '';
}
