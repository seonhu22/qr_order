/**
 * @fileoverview 검색 필터 draft/applied 상태 공용 훅
 *
 * @description
 * - 사용자가 입력 중인 값(draft)과 실제 조회에 적용된 값(applied)을 분리한다.
 * - 조회 실행 시점에만 applied를 갱신해 불필요한 재조회/재렌더를 줄인다.
 *
 * @remarks
 * 이 훅은 "검색 입력창 상태"와 "실제 서버 조회 조건"이 다른 화면에서 사용한다.
 * 예를 들어 입력 중인 텍스트를 즉시 query key에 반영하면,
 * 타이핑마다 API 호출이 발생할 수 있다.
 * 이 훅은 그 문제를 방지하기 위한 최소 공용 규약이다.
 */

import { startTransition, useState } from 'react';

type UseFilterKeywordStateReturn = {
  draftKeyword: string;
  appliedKeyword: string;
  setDraftKeyword: (value: string) => void;
  applyDraftKeyword: () => void;
  resetKeywords: () => void;
};

/**
 * 필터 검색어 상태를 공통 규약으로 관리한다.
 *
 * @param {string} [initialKeyword=''] 최초 draft/applied 기본값
 * @returns {UseFilterKeywordStateReturn}
 *
 * @example
 * ```tsx
 * const {
 *   draftKeyword,
 *   appliedKeyword,
 *   setDraftKeyword,
 *   applyDraftKeyword,
 *   resetKeywords,
 * } = useFilterKeywordState('');
 *
 * const query = useSomeListQuery(appliedKeyword.trim());
 *
 * <TextInput
 *   value={draftKeyword}
 *   onChange={(e) => setDraftKeyword(e.target.value)}
 * />
 * <Button onClick={applyDraftKeyword}>조회</Button>
 * <Button onClick={resetKeywords}>초기화</Button>
 * ```
 *
 * @example
 * ```tsx
 * // 동작 시나리오
 * // 1) 사용자가 "판교" 입력 -> draftKeyword = "판교", appliedKeyword = ""
 * // 2) 조회 클릭 -> appliedKeyword = "판교" 로 바뀌며 서버 조회 실행
 * // 3) 초기화 클릭 -> draft/applied 모두 ""
 * ```
 */
export function useFilterKeywordState(initialKeyword = ''): UseFilterKeywordStateReturn {
  const [draftKeyword, setDraftKeyword] = useState(initialKeyword);
  const [appliedKeyword, setAppliedKeyword] = useState(initialKeyword);

  const applyDraftKeyword = () => {
    startTransition(() => {
      setAppliedKeyword(draftKeyword);
    });
  };

  const resetKeywords = () => {
    startTransition(() => {
      setDraftKeyword('');
      setAppliedKeyword('');
    });
  };

  return {
    draftKeyword,
    appliedKeyword,
    setDraftKeyword,
    applyDraftKeyword,
    resetKeywords,
  };
}
