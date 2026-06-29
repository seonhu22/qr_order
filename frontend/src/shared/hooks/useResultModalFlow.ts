import { useState } from 'react';

type ResultModalOptions = {
  title?: string;
  description: string;
  onConfirm?: () => void;
};

export type ResultModalState = {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
};

const INITIAL_RESULT_MODAL: ResultModalState = {
  open: false,
  title: '',
  description: '',
  onConfirm: () => {},
};

export function useResultModalFlow() {
  const [modalProps, setModalProps] = useState<ResultModalState>(INITIAL_RESULT_MODAL);

  const close = () => setModalProps((prev) => ({ ...prev, open: false }));

  const show = ({ title = '알림', description, onConfirm }: ResultModalOptions) => {
    setModalProps({
      open: true,
      title,
      description,
      onConfirm: onConfirm ?? close,
    });
  };

  return {
    modalProps,
    close,
    showSuccess: show,
    showError: show,
    showConfirm: show,
  };
}
