export type OrderedRow = {
  id: string;
  ordNo: number;
};

/**
 * 순번이 있는 상세 테이블 행의 추가/삭제/이동 규칙을 공통으로 관리한다.
 *
 * @description
 * 공통코드와 규칙관리처럼 "현재 배열 순서가 곧 저장 순서"인 화면에서 재사용한다.
 */
export function useOrderedRowEditor<T extends OrderedRow>() {
  const normalizeOrdNo = (rows: T[]) =>
    rows.map((row, index) => ({
      ...row,
      ordNo: index + 1,
    }));

  const appendRow = (rows: T[], nextRow: T) => normalizeOrdNo([...rows, nextRow]);

  const removeRow = (rows: T[], rowId?: string) =>
    normalizeOrdNo(rows.filter((row) => row.id !== rowId));

  const moveRowUp = (rows: T[], rowId?: string) => {
    const nextRows = [...rows];

    for (let index = 1; index < nextRows.length; index += 1) {
      if (nextRows[index].id === rowId && nextRows[index - 1].id !== rowId) {
        [nextRows[index - 1], nextRows[index]] = [nextRows[index], nextRows[index - 1]];
      }
    }

    return normalizeOrdNo(nextRows);
  };

  const moveRowDown = (rows: T[], rowId?: string) => {
    const nextRows = [...rows];

    for (let index = nextRows.length - 2; index >= 0; index -= 1) {
      if (nextRows[index].id === rowId && nextRows[index + 1].id !== rowId) {
        [nextRows[index], nextRows[index + 1]] = [nextRows[index + 1], nextRows[index]];
      }
    }

    return normalizeOrdNo(nextRows);
  };

  return {
    normalizeOrdNo,
    appendRow,
    removeRow,
    moveRowUp,
    moveRowDown,
  };
}
