import { useState } from 'react';

type NoticeState = {
  title: string;
  description: string;
} | null;

export type DetailRowErrorState = Record<string, Record<string, boolean | undefined>>;

type UseDetailTableSaveFlowParams = {
  validateRows: () => DetailRowErrorState;
  onSaveRows: () => Promise<boolean>;
  applyServerValidationErrors?: (message: string) => DetailRowErrorState;
  saveErrorMessage?: string;
};

/**
 * 상세 테이블의 저장 확인/결과 안내/행 단위 에러 흐름을 공통으로 관리한다.
 */
export function useDetailTableSaveFlow({
  validateRows,
  onSaveRows,
  applyServerValidationErrors,
  saveErrorMessage = '상세 저장 중 오류가 발생했습니다.',
}: UseDetailTableSaveFlowParams) {
  const [notice, setNotice] = useState<NoticeState>(null);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [rowErrors, setRowErrors] = useState<DetailRowErrorState>({});

  const clearRowError = (rowId: string, key: string) => {
    setRowErrors((prev) => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        [key]: false,
      },
    }));
  };

  const requestSave = () => {
    const nextErrors = validateRows();
    setRowErrors(nextErrors);

    const hasErrors = Object.values(nextErrors).some((fields) =>
      Object.values(fields).some(Boolean),
    );

    if (hasErrors) {
      return false;
    }

    setIsSaveConfirmOpen(true);
    return true;
  };

  const confirmSave = async () => {
    setIsConfirming(true);
    try {
      const hasChanges = await onSaveRows();
      setIsSaveConfirmOpen(false);
      setRowErrors({});
      setNotice({
        title: '알림',
        description: hasChanges ? '저장되었습니다.' : '변경된 내용이 없습니다.',
      });
    } catch (error) {
      setIsSaveConfirmOpen(false);

      if (error instanceof Error && applyServerValidationErrors) {
        setRowErrors(applyServerValidationErrors(error.message));
      }

      setNotice({
        title: '오류',
        description: error instanceof Error ? error.message : saveErrorMessage,
      });
    } finally {
      setIsConfirming(false);
    }
  };

  return {
    rowErrors,
    notice,
    isSaveConfirmOpen,
    isConfirming,
    clearRowError,
    requestSave,
    confirmSave,
    closeSaveConfirm: () => setIsSaveConfirmOpen(false),
    closeNotice: () => setNotice(null),
  };
}
