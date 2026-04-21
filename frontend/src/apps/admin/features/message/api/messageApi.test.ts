import { describe, expect, it } from 'vitest';
import { buildMessageRequest, mapToMessageModel } from './messageApi';

describe('messageApi', () => {
  it('maps server dto to message row model', () => {
    expect(
      mapToMessageModel({
        sysId: 'msg-1',
        msgCd: 'MSG001',
        msgNm: '주문 완료',
        msgDescription: '주문이 정상적으로 접수되었습니다.',
      }),
    ).toEqual({
      id: 'msg-1',
      sysId: 'msg-1',
      code: 'MSG001',
      name: '주문 완료',
      content: '주문이 정상적으로 접수되었습니다.',
      isNew: false,
    });
  });

  it('builds new, update and delete items from draft rows', () => {
    const originalRows = [
      {
        id: 'msg-1',
        sysId: 'msg-1',
        code: 'MSG001',
        name: '주문 완료',
        content: '주문이 정상적으로 접수되었습니다.',
        isNew: false,
      },
      {
        id: 'msg-2',
        sysId: 'msg-2',
        code: 'MSG002',
        name: '결제 완료',
        content: '결제가 완료되었습니다.',
        isNew: false,
      },
    ];

    const currentRows = [
      {
        id: 'msg-1',
        sysId: 'msg-1',
        code: 'MSG001',
        name: '주문 완료',
        content: '주문이 접수되었습니다.',
        isNew: false,
      },
      {
        id: 'temp-1',
        code: 'MSG003',
        name: '배달 시작',
        content: '배달이 시작되었습니다.',
        isNew: true,
      },
    ];

    expect(buildMessageRequest(currentRows, originalRows)).toEqual({
      newItems: [
        {
          sysId: undefined,
          msgCd: 'MSG003',
          msgNm: '배달 시작',
          msgDescription: '배달이 시작되었습니다.',
        },
      ],
      updateItems: [
        {
          sysId: 'msg-1',
          msgCd: 'MSG001',
          msgNm: '주문 완료',
          msgDescription: '주문이 접수되었습니다.',
        },
      ],
      delItems: [
        {
          sysId: 'msg-2',
          msgCd: 'MSG002',
          msgNm: '결제 완료',
          msgDescription: '결제가 완료되었습니다.',
        },
      ],
    });
  });
});
