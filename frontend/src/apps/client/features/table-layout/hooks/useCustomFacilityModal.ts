import { useCallback, useState } from 'react';

type UseCustomFacilityModalParams = {
  onConfirm: (label: string) => void;
};

// "커스텀 시설 추가" 모달의 열림/입력값/검증 상태만 담당한다. 캔버스 배치·저장 로직(useTableLayoutPage)과는
// 무관한 순수 UI 상태라 별도 훅으로 분리했다 — useMenuCategoryModalFlow와 같은 결.
export function useCustomFacilityModal({ onConfirm }: UseCustomFacilityModalParams) {
  const [isOpen, setIsOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [errorText, setErrorText] = useState<string | undefined>(undefined);

  const open = useCallback(() => {
    setLabel('');
    setErrorText(undefined);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const changeLabel = useCallback((value: string) => {
    setLabel(value);
    setErrorText(undefined);
  }, []);

  const confirm = useCallback(() => {
    const trimmed = label.trim();
    if (!trimmed) {
      setErrorText('시설 이름을 입력해 주세요.');
      return;
    }
    onConfirm(trimmed);
    setIsOpen(false);
  }, [label, onConfirm]);

  return { isOpen, label, errorText, open, close, changeLabel, confirm };
}
