/**
 * @fileoverview 공통코드 상세 테이블 모달/검증 흐름 훅
 *
 * @description
 * - 상세 테이블에서 사용하는 저장 확인 모달, 안내 모달, 행 단위 에러 상태를 관리한다.
 * - 테이블 컴포넌트는 렌더링과 이벤트 연결에 집중하고, 저장 전후 흐름은 이 훅이 담당한다.
 */

import { useState } from 'react';
import type { DetailCode } from '../types';

type NoticeState = {
  title: string;
  description: string;
} | null;

type RowErrorState = Record<string, { code?: boolean; name?: boolean }>;

type UseCommonCodeDetailTableFlowParams = {
  rows: DetailCode[];
  onSaveRows: () => Promise<boolean>;
};

/**
 * 공통코드 상세 테이블의 저장 흐름을 관리한다.
 *
 * @description
 * - 프론트 필수값 검증
 * - 저장 확인 모달 열기/닫기
 * - 저장 성공/실패 안내 모달 표시
 * - 서버 validation 메시지를 인풋 error 상태로 매핑
 * 을 한곳에서 처리한다.
 */
export function useCommonCodeDetailTableFlow({
  rows,
  onSaveRows,
}: UseCommonCodeDetailTableFlowParams) {
  const [notice, setNotice] = useState<NoticeState>(null);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [rowErrors, setRowErrors] = useState<RowErrorState>({});

  /**
   * 특정 행/필드의 에러 표시를 해제한다.
   */
  const clearRowError = (detailId: string, key: 'code' | 'name') => {
    setRowErrors((prev) => ({
      ...prev,
      [detailId]: {
        ...prev[detailId],
        [key]: false,
      },
    }));
  };

  /**
   * 서버 에러 메시지를 기반으로 필드 에러를 보수적으로 매핑한다.
   */
  const applyServerValidationErrors = (message: string) => {
    const nextErrors: RowErrorState = {};
    const normalized = message.toLowerCase();

    if (normalized.includes('common_cd') || message.includes('공통코드')) {
      rows.forEach((row) => {
        nextErrors[row.id] = {
          ...nextErrors[row.id],
          code: true,
        };
      });
    }

    if (normalized.includes('common_nm') || message.includes('공통코드명')) {
      rows.forEach((row) => {
        nextErrors[row.id] = {
          ...nextErrors[row.id],
          name: true,
        };
      });
    }

    if (Object.keys(nextErrors).length > 0) {
      setRowErrors(nextErrors);
    }
  };

  /**
   * 저장 전 프론트 필수값 검증을 수행한다.
   *
   * @returns {boolean} 검증 통과 여부
   */
  const requestSave = () => {
    const nextErrors = Object.fromEntries(
      rows.map((row) => [
        row.id,
        {
          code: row.isNew ? !row.code.trim() : false,
          name: !row.name.trim(),
        },
      ]),
    ) as RowErrorState;

    setRowErrors(nextErrors);

    const hasErrors = Object.values(nextErrors).some((error) => error.code || error.name);

    if (hasErrors) {
      return false;
    }

    setIsSaveConfirmOpen(true);
    return true;
  };

  /**
   * 저장 확인 이후 실제 저장을 수행한다.
   */
  const confirmSave = async () => {
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

      if (error instanceof Error) {
        applyServerValidationErrors(error.message);
      }

      setNotice({
        title: '오류',
        description: error instanceof Error ? error.message : '상세 저장 중 오류가 발생했습니다.',
      });
    }
  };

  return {
    rowErrors,
    notice,
    isSaveConfirmOpen,
    clearRowError,
    requestSave,
    confirmSave,
    closeSaveConfirm: () => setIsSaveConfirmOpen(false),
    closeNotice: () => setNotice(null),
  };
}
