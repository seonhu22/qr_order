import { InputBase, InputWrapper } from '@/shared/components/input';
import { WrapperModal } from '@/shared/components/modal';

type CustomFacilityAddModalProps = {
  open: boolean;
  label: string;
  errorText?: string;
  onChangeLabel: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
};

export function CustomFacilityAddModal({
  open,
  label,
  errorText,
  onChangeLabel,
  onConfirm,
  onClose,
}: CustomFacilityAddModalProps) {
  return (
    <WrapperModal
      size="sm"
      open={open}
      title="커스텀 시설 추가"
      subtitle="테이블 배치에 표시할 시설 이름을 입력하세요."
      primaryAction={{ label: '확인', onClick: onConfirm }}
      secondaryAction={{ label: '닫기', onClick: onClose }}
      onClose={onClose}
    >
      <InputWrapper label="시설 이름" inputId="custom-facility-name" required errorText={errorText}>
        <InputBase
          id="custom-facility-name"
          size="md"
          value={label}
          required
          controlState={errorText ? 'error' : ''}
          placeholder="예: 포토존"
          onChange={(event) => onChangeLabel(event.target.value)}
        />
      </InputWrapper>
    </WrapperModal>
  );
}
