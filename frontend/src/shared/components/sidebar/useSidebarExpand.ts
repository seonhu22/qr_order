import { useCallback, useState } from 'react';

type UseSidebarExpandOptions = {
  initialDepth1Keys?: string[];
  initialDepth2Keys?: string[];
};

/**
 * 사이드바 depth1/depth2 그룹 열림 상태를 관리하는 공용 훅.
 *
 * - toggle: 해당 그룹만 토글, 나머지 열린 그룹 유지 (다중 열기)
 * - ensureOpen: 해당 그룹이 닫혀 있으면 추가, 나머지 유지 (URL 변경 시)
 * - resetTo: 해당 그룹만 남기고 나머지 닫기 (사이드바 재오픈 시)
 */
export function useSidebarExpand(options: UseSidebarExpandOptions = {}) {
  const [expandedDepth1Keys, setExpandedDepth1Keys] = useState<string[]>(
    options.initialDepth1Keys ?? [],
  );
  const [expandedDepth2Keys, setExpandedDepth2Keys] = useState<string[]>(
    options.initialDepth2Keys ?? [],
  );

  const toggleDepth1 = useCallback((key: string, hasChildren = true) => {
    if (!hasChildren) return;
    setExpandedDepth1Keys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }, []);

  const toggleDepth2 = useCallback((key: string, hasChildren = true) => {
    if (!hasChildren) return;
    setExpandedDepth2Keys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }, []);

  const ensureOpen = useCallback((depth1Key: string | null, depth2Key: string | null) => {
    if (depth1Key) {
      setExpandedDepth1Keys((prev) => (prev.includes(depth1Key) ? prev : [...prev, depth1Key]));
    }
    if (depth2Key) {
      setExpandedDepth2Keys((prev) => (prev.includes(depth2Key) ? prev : [...prev, depth2Key]));
    }
  }, []);

  const resetTo = useCallback((depth1Key: string | null, depth2Key: string | null) => {
    setExpandedDepth1Keys(depth1Key ? [depth1Key] : []);
    setExpandedDepth2Keys(depth2Key ? [depth2Key] : []);
  }, []);

  return {
    expandedDepth1Keys,
    expandedDepth2Keys,
    toggleDepth1,
    toggleDepth2,
    ensureOpen,
    resetTo,
  };
}
