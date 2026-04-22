import {
  useGetNotice,
  useNewNotice,
  useUpdateNotice,
  useDelNotice,
} from '@/generated/settings-controller/settings-controller';
import { queryKeys } from '@/shared/api/queryKeys';
import type { NoticeResponse } from '@/generated/types/noticeResponse';
import type { NoticeManageRow } from '../types';

export function mapToNoticeManageRow(res: NoticeResponse, index: number): NoticeManageRow {
  return {
    id: `notice-${index}-${res.noticeTitle ?? ''}`,
    sysId: '',
    title: res.noticeTitle ?? '',
    content: res.noticeDescription ?? '',
    registrant: '',
    registeredAt: res.startDate ?? '',
    updatedAt: '',
  };
}

export function useNoticeManageQuery(searchKeyword?: string) {
  const params = searchKeyword ? { searchKeyword } : {};
  return useGetNotice(params, {
    query: {
      queryKey: queryKeys.notice.list(searchKeyword ?? ''),
    },
  });
}

export function useCreateNoticeMutation() {
  return useNewNotice();
}

export function useUpdateNoticeMutation() {
  return useUpdateNotice();
}

export function useDeleteNoticesMutation() {
  return useDelNotice();
}