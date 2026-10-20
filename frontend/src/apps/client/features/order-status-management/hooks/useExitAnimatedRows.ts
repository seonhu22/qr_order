/**
 * @fileoverview 서버 상태에서 사라진 행을 애니메이션이 끝날 때까지 잠깐 더 렌더링하는 훅
 *
 * @description
 * 보드 카드는 writable 로컬 복사본을 두지 않고 서버 상태에서 바로 파생한다(useOrderStatusBoardPage 주석 참고).
 * 이 훅은 그 원칙을 깨지 않는다 — 이미 서버 데이터에서 빠진("사라지기로 확정된") 행만 애니메이션 길이만큼
 * 잠깐 더 화면에 들고 있다가 치운다. prefers-reduced-motion이면 애니메이션 없이 바로 치운다
 * (StaffCallToast/ConsumerBottomSheet와 같은 "닫힘 애니메이션 끝날 때까지 렌더 유지" 패턴).
 *
 * 상태 변경으로 다른 컬럼으로 넘어가는 경우도, 보드에서 완전히 빠지는 경우(결제/취소/완료)와
 * 똑같이 이 애니메이션을 탄다 — 이 컬럼 목록에서 빠지면 그 이유를 가리지 않고 항상 애니메이션한다.
 */

import { useEffect, useState } from 'react';

type ExitAnimatedRow<T> = { row: T; isLeaving: boolean };

function mergeRows<T extends { id: string }>(
  current: ExitAnimatedRow<T>[],
  rows: T[],
): ExitAnimatedRow<T>[] {
  const nextById = new Map(rows.map((row) => [row.id, row]));
  const seenIds = new Set<string>();

  const merged = current.map((item) => {
    seenIds.add(item.row.id);
    const freshRow = nextById.get(item.row.id);
    if (freshRow) return { row: freshRow, isLeaving: false };
    return item.isLeaving ? item : { row: item.row, isLeaving: true };
  });

  const appended = rows
    .filter((row) => !seenIds.has(row.id))
    .map((row) => ({ row, isLeaving: false }));

  return [...merged, ...appended];
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useExitAnimatedRows<T extends { id: string }>(rows: T[]) {
  const [renderedRows, setRenderedRows] = useState<ExitAnimatedRow<T>[]>(() =>
    rows.map((row) => ({ row, isLeaving: false })),
  );

  useEffect(() => {
    setRenderedRows((current) => {
      const merged = mergeRows(current, rows);
      return prefersReducedMotion() ? merged.filter((item) => !item.isLeaving) : merged;
    });
  }, [rows]);

  const handleExited = (id: string) => {
    setRenderedRows((current) => current.filter((item) => item.row.id !== id));
  };

  return { renderedRows, handleExited };
}
