import { useGetMessage, useSaveMessage } from '@/generated/settings-controller/settings-controller';
import type { Message } from '@/generated/types/message';
import type { MessageRequest } from '@/generated/types/messageRequest';
import { queryKeys } from '@/shared/api/queryKeys';
import type { MessageRow } from '../types';

export function mapToMessageModel(message: Message): MessageRow {
  return {
    id: message.sysId ?? message.msgCd ?? '',
    sysId: message.sysId,
    code: message.msgCd ?? '',
    name: message.msgNm ?? '',
    content: message.msgDescription ?? '',
    isNew: false,
  };
}

export function mapToMessagePayload(row: MessageRow): Message {
  return {
    sysId: row.sysId,
    msgCd: row.code,
    msgNm: row.name,
    msgDescription: row.content,
  };
}

function isSameMessageRow(a: MessageRow, b: MessageRow) {
  return a.code === b.code && a.name === b.name && a.content === b.content;
}

export function buildMessageRequest(
  currentRows: MessageRow[],
  originalRows: MessageRow[],
): MessageRequest {
  const originalBySysId = new Map(
    originalRows.filter((row) => row.sysId).map((row) => [row.sysId as string, row]),
  );
  const currentBySysId = new Map(
    currentRows.filter((row) => row.sysId).map((row) => [row.sysId as string, row]),
  );

  const newItems = currentRows.filter((row) => row.isNew).map(mapToMessagePayload);
  const updateItems = currentRows
    .filter((row) => row.sysId && !row.isNew)
    .filter((row) => {
      const originalRow = originalBySysId.get(row.sysId as string);
      return originalRow ? !isSameMessageRow(row, originalRow) : false;
    })
    .map(mapToMessagePayload);
  const delItems = originalRows
    .filter((row) => row.sysId && !currentBySysId.has(row.sysId as string))
    .map(mapToMessagePayload);

  return {
    newItems,
    updateItems,
    delItems,
  };
}

export function hasMessageChanges(request: MessageRequest) {
  return Boolean(request.newItems?.length || request.updateItems?.length || request.delItems?.length);
}

export function useMessageQuery(searchKeyword = '') {
  return useGetMessage(searchKeyword ? { searchKeyword } : undefined, {
    query: {
      queryKey: queryKeys.message.list(searchKeyword),
    },
  });
}

export function useSaveMessagesMutation() {
  const mutation = useSaveMessage();

  return {
    mutateAsync: async (request: MessageRequest) => mutation.mutateAsync({ data: request }),
    isPending: mutation.isPending,
  };
}
