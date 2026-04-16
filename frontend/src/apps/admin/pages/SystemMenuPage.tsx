/**
 * @fileoverview 메뉴 관리 페이지 컨테이너
 *
 * @description
 * - 화면 레이아웃과 feature 컴포넌트를 조립하는 역할만 맡는다.
 * - 실제 상태 조합과 서버 연동은 useSystemMenuPageState로 위임한다.
 * - 저장 확인·삭제 목록 확인·초기화 확인·안내 모달을 이 페이지에서 한 번에 조립한다.
 */

import AdminMainLayout from '@/apps/admin/layout/AdminMainLayout';
import { SystemMenuTree } from '@/apps/admin/features/system-menu/components/SystemMenuTree';
import { useSystemMenuPageState } from '@/apps/admin/features/system-menu/hooks/useSystemMenuPageState';
import {
  ConfirmModal,
  DeleteListConfirmModal,
  SaveConfirmModal,
  SimpleDefaultModal,
} from '@/shared/components/modal';
import './SystemMenuPage.css';


export function SystemMenuPage() {
  const { data, status, actions, uiProps } = useSystemMenuPageState();

  return (
    <>
      <AdminMainLayout
        adminMainTitle="메뉴 관리"
        depth1="시스템"
        depth2="시스템 관리"
        className="admin-main-layout-page--fixed"
      >
        <SystemMenuTree
          key={uiProps.treeKey}
          nodes={data.nodes}
          isLoading={status.isLoading}
          isError={status.isError}
          selectedId={uiProps.selectedId}
          onSelect={actions.handleSelect}
          onUpdateData={actions.handleUpdateData}
          defaultExpandedIds={uiProps.defaultExpandedIds}
          expandTrigger={uiProps.expandTrigger}
          canAddChild={uiProps.canAddChild}
          canDelete={uiProps.canDelete}
          canMoveUp={uiProps.canMoveUp}
          canMoveDown={uiProps.canMoveDown}
          isSaving={status.isSaving}
          onAddSibling={actions.handleAddSibling}
          onAddChild={actions.handleAddChild}
          onDelete={actions.handleDelete}
          onMoveUp={actions.handleMoveUp}
          onMoveDown={actions.handleMoveDown}
          onSave={actions.requestSave}
          onReset={actions.handleReset}
          nodeErrors={uiProps.nodeErrors}
        />
      </AdminMainLayout>

      {/* 초기화 dirty guard 확인 모달 */}
      <ConfirmModal
        open={uiProps.isResetConfirmOpen}
        tone="info"
        title="초기화하시겠습니까?"
        description="저장되지 않은 내용이 있습니다."
        primaryAction={{ onClick: actions.confirmReset }}
        secondaryAction={{ onClick: actions.closeResetConfirm }}
        onClose={actions.closeResetConfirm}
      />

      {/* 저장 전 삭제 항목 목록 확인 모달 */}
      <DeleteListConfirmModal
        open={uiProps.deleteListConfirm.open}
        items={uiProps.deleteListConfirm.items}
        primaryAction={{
          loading: uiProps.isConfirming,
          onClick: actions.confirmDeleteListAndProceed,
        }}
        secondaryAction={{ onClick: actions.closeDeleteListConfirm }}
        onClose={actions.closeDeleteListConfirm}
      />

      {/* 저장 확인 모달 */}
      <SaveConfirmModal
        open={uiProps.isSaveConfirmOpen}
        title="저장하시겠습니까?"
        description="메뉴 정보를 저장합니다."
        primaryAction={{
          label: '확인',
          loading: uiProps.isConfirming,
          onClick: actions.confirmSave,
        }}
        secondaryAction={{
          disabled: uiProps.isConfirming,
          onClick: actions.closeSaveConfirm,
        }}
        onClose={actions.closeSaveConfirm}
      />

      {/* 안내 모달 (입력 오류 / 저장 완료 / 저장 실패) */}
      <SimpleDefaultModal
        open={!!uiProps.notice}
        title={uiProps.notice?.title ?? '알림'}
        description={uiProps.notice?.description}
        onClose={actions.closeNotice}
      />
    </>
  );
}
