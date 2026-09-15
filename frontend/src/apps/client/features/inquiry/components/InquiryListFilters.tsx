import type { KeyboardEvent } from 'react';
import { Icon } from '@/shared/assets/icons/Icon';
import { ResetFilterButton, SearchFilterButton } from '@/shared/components/button';
import { InputBase, InputWrapper, SelectInput } from '@/shared/components/input';
import type { InquiryAnswerFilterKey } from '../hooks/useInquiryListPage';

const ANSWER_STATUS_OPTIONS = [
  { value: 'ALL', label: '답변상태 전체' },
  { value: 'answered', label: '답변' },
  { value: 'pending', label: '미답변' },
];

type InquiryListFiltersProps = {
  draftKeyword: string;
  draftAnswerStatus: InquiryAnswerFilterKey;
  onKeywordChange: (value: string) => void;
  onAnswerStatusChange: (value: InquiryAnswerFilterKey) => void;
  onSearch: () => void;
  onReset: () => void;
};

export function InquiryListFilters({
  draftKeyword,
  draftAnswerStatus,
  onKeywordChange,
  onAnswerStatusChange,
  onSearch,
  onReset,
}: InquiryListFiltersProps) {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') onSearch();
  };

  return (
    <article className="inquiry-list-filters" aria-label="문의사항 검색">
      <SelectInput
        size="md"
        value={draftAnswerStatus}
        options={ANSWER_STATUS_OPTIONS}
        onChange={(value) => onAnswerStatusChange(value as InquiryAnswerFilterKey)}
        className="inquiry-list-filters__status"
      />

      <InputWrapper inputId="inquiry-list-keyword" className="inquiry-list-filters__keyword">
        <InputBase
          id="inquiry-list-keyword"
          size="md"
          value={draftKeyword}
          placeholder="제목으로 검색"
          leftSlot={<Icon id="i-search" size={14} />}
          onChange={(e) => onKeywordChange(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="문의사항 검색어"
        />
      </InputWrapper>

      <div className="inquiry-list-filters__actions">
        <ResetFilterButton onClick={onReset} />
        <SearchFilterButton onClick={onSearch} />
      </div>
    </article>
  );
}
