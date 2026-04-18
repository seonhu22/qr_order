import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RuleManagementPage } from './RuleManagementPage';

describe('RuleManagementPage', () => {
  it('opens create modal, save confirm modal, and success notice for a new master row', async () => {
    render(<RuleManagementPage />);

    fireEvent.click(screen.getByRole('button', { name: '신규' }));

    const editorDialog = screen.getByRole('dialog', { name: '규칙 등록' });
    fireEvent.change(within(editorDialog).getByRole('textbox', { name: /규칙코드/ }), {
      target: { value: 'NEW_RULE' },
    });
    fireEvent.change(within(editorDialog).getByRole('textbox', { name: /규칙명/ }), {
      target: { value: '신규규칙' },
    });
    fireEvent.click(within(editorDialog).getByRole('button', { name: '확인' }));

    const saveDialog = screen.getByRole('dialog', { name: '저장하시겠습니까?' });
    fireEvent.click(within(saveDialog).getByRole('button', { name: '확인' }));

    expect(await screen.findByRole('dialog', { name: '알림' })).toHaveTextContent(
      '저장되었습니다.',
    );
    expect(screen.getByText('NEW_RULE')).toBeInTheDocument();
  });

  it('opens edit confirm modal when saving an existing master row', () => {
    render(<RuleManagementPage />);

    fireEvent.click(screen.getAllByRole('button', { name: /수정$/ })[0]);

    const editorDialog = screen.getByRole('dialog', { name: '규칙 수정' });
    fireEvent.change(within(editorDialog).getByRole('textbox', { name: /규칙명/ }), {
      target: { value: '주문상태수정' },
    });
    fireEvent.click(within(editorDialog).getByRole('button', { name: '확인' }));

    expect(screen.getByRole('dialog', { name: '수정된 내용을 저장하시겠습니까?' })).toBeInTheDocument();
  });

  it('opens delete confirm modal and shows success notice after deleting checked rows', async () => {
    render(<RuleManagementPage />);

    const [, firstRowCheckbox] = screen.getAllByRole('checkbox');
    fireEvent.click(firstRowCheckbox);
    fireEvent.click(screen.getByRole('button', { name: '삭제' }));

    const deleteDialog = screen.getByRole('dialog', { name: '삭제하시겠습니까?' });
    fireEvent.click(within(deleteDialog).getByRole('button', { name: '확인' }));

    expect(await screen.findByRole('dialog', { name: '알림' })).toHaveTextContent('삭제되었습니다.');
    expect(screen.queryByText('ORDER_STATUS')).not.toBeInTheDocument();
  });

  it('opens detail save confirm modal and shows success notice after saving detail changes', async () => {
    render(<RuleManagementPage />);

    fireEvent.click(screen.getByText('주문상태'));

    const detailInput = screen.getByLabelText('rule-detail-1 상세명');
    fireEvent.change(detailInput, {
      target: { value: '주문요청수정' },
    });

    fireEvent.click(screen.getAllByRole('button', { name: '저장' })[0]);

    const saveDialog = screen.getByRole('dialog', { name: '저장하시겠습니까?' });
    fireEvent.click(within(saveDialog).getByRole('button', { name: '확인' }));

    expect(await screen.findByRole('dialog', { name: '알림' })).toHaveTextContent(
      '저장되었습니다.',
    );
  });

  it('shows dirty warning when closing the master editor with unsaved changes', () => {
    render(<RuleManagementPage />);

    fireEvent.click(screen.getByRole('button', { name: '신규' }));

    const editorDialog = screen.getByRole('dialog', { name: '규칙 등록' });
    fireEvent.change(within(editorDialog).getByRole('textbox', { name: /규칙코드/ }), {
      target: { value: 'DIRTY_RULE' },
    });
    fireEvent.click(within(editorDialog).getByRole('button', { name: '닫기' }));

    expect(screen.getByRole('dialog', { name: '알림' })).toHaveTextContent(
      '수정하신 내용이 저장되지 않았습니다.',
    );
  });
});
