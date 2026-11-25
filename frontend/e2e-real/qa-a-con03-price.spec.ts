import { execFileSync } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { expect, test, type APIRequestContext } from '@playwright/test';
import type {
  CommonResponse, ConsumerOrderCreateEnvelope, ConsumerOrderDetailEnvelope, ConsumerOrderListEnvelope,
  ConsumerSessionEnvelope, OrderHistoryResponse, PaymentInfoDetailResponse, PaymentInfoMasterResponse,
  SettlementResponse, StatusItem, StatusResponse,
} from '../src/generated/types';

const baseURL = 'http://localhost:3000';
const plant = 'DEMO01';
const store = '/api/client/store_manage';
const menus = '/api/client/menu_manage';
const consumer = '/api/client/consumer';
const orders = `${consumer}/orders`;
const status = '/api/client/order_manage/status';
const history = '/api/client/order_manage/history/search';
const payment = '/api/client/payment_manage';
const original = { menu: 1000, option: 300 };
const updated = { menu: 1377, option: 500 };
const quantity = 2;
const originalTotal = (original.menu + original.option) * quantity;
const updatedTotal = (updated.menu + updated.option) * quantity;
const idPattern = /^[0-9A-HJKMNP-TV-Z]{26}$/;

test.use({ baseURL });

function db(sql: string) {
  const { PGHOST, PGPORT, PGDATABASE, QA_AUTH_PSQL } = process.env;
  if (PGHOST !== '127.0.0.1' || PGPORT !== '55432' || PGDATABASE !== 'qrdemo' || !QA_AUTH_PSQL) {
    throw new Error('로컬 qrdemo 연결과 QA_AUTH_PSQL이 필요합니다.');
  }
  return execFileSync(QA_AUTH_PSQL, ['-XwAqt', '-v', 'ON_ERROR_STOP=1'], {
    input: sql, encoding: 'utf8', timeout: 8_000,
  }).trim();
}

async function get<T>(client: APIRequestContext, path: string, expected = 200) {
  const response = await client.get(path);
  console.log(`GET ${path} -> ${response.status()}`);
  expect(response.status(), path).toBe(expected);
  return (await response.json()) as T;
}

async function post<T extends { success?: boolean } = CommonResponse>(
  client: APIRequestContext,
  path: string,
  payload: Parameters<APIRequestContext['post']>[1],
  expected = 200,
) {
  const response = await client.post(path, payload);
  const body = (await response.json()) as T;
  console.log(`POST ${path} -> ${response.status()} {${Object.keys(body).join(',')}}`);
  expect(response.status(), path).toBe(expected);
  expect(body.success, path).toBe(true);
  return body;
}

type Price = typeof original;
type Order = { orderId: string; visitId: string };
type MoneyRow = { price: number; qty: number; totalPrice: number };
type PaymentLine = MoneyRow & { menuName: string; options: MoneyRow[] };

function checkEvidence(label: string, actual: unknown, expected: unknown) {
  console.log(`${label} ${JSON.stringify(actual)}`);
  expect.soft({ value: actual }, label).toEqual({ value: expected });
}

function statusAmounts(order: StatusItem | undefined) {
  return {
    total: order?.footer?.totalPrice,
    menu: order?.body?.find((row) => row.rowType === 'MENU')?.price,
    option: order?.body?.find((row) => row.rowType === 'OPTION')?.price,
  };
}

test('CON-03 / 주문 단가 보존과 NULL 단가의 카탈로그 대체', async ({ request, playwright }) => {
  const password = process.env.QA_AUTH_FIXTURE_PASSWORD;
  if (!password) throw new Error('QA_AUTH_FIXTURE_PASSWORD가 필요합니다.');
  const tag = `AUTO-QA qa-a con03 ${randomBytes(5).toString('hex')}`;
  const day = db('select current_date;');
  const dates = `startDate=${day}&endDate=${day}`;
  const settlementPath = `${payment}/settlement/search?searchStartDate=${day}&searchEndDate=${day}`;
  const scope = (column: string) => `sys_plant_cd='${plant}' and ${column}='${tag}'`;
  const recordId = (table: string, column: string, id = 'sys_id') => {
    const result = db(`select ${id} from ${table} where ${scope(column)}`);
    expect(result, table).toMatch(idPattern);
    return result;
  };
  const tableNum = Number(db(`select n from generate_series(93, 99) n where not exists
    (select 1 from table_info where sys_plant_cd='${plant}' and table_num=n) order by n limit 1;`));
  expect(tableNum).toBeGreaterThanOrEqual(93);
  await post(request, '/api/auth/login', { data: { userId: 'demo_owner', userPassword: password } });
  const me = await get<{ data: { sysPlantCd: string } }>(request, '/api/auth/me');
  expect(me.data.sysPlantCd).toBe(plant);

  const visits = `select om.sys_id from order_master om join table_info ti on ti.sys_id=om.link_sys_id
    where om.sys_plant_cd='${plant}' and ti.sys_plant_cd='${plant}' and ti.table_name='${tag}'`;
  const targets = {
    table_info: scope('table_name'),
    qr_code: scope('description'),
    store_menu_master: scope('category_name'),
    store_menu_detail: scope('menu_name'),
    store_menu_option_group: scope('group_name'),
    store_menu_option_detail: scope('menu_option_name'),
  };
  const requestIds = [randomUUID(), randomUUID()];
  const openedClients: APIRequestContext[] = [];
  try {
    await post(request, `${store}/table_info/save`, { data: { newItems: [
      { tableName: tag, tableNum, tableQty: 4, useYn: 'Y' },
    ] } });
    const tableId = recordId('table_info', 'table_name');
    await post(request, `${store}/qr_code/save`, { data: { newItems: [
      { linkSysId: tableId, description: tag, useYn: 'Y' },
    ] } });
    const qrUrl = recordId('qr_code', 'description', 'url');
    await post(request, `${menus}/menu/master/new`, { data: { categoryName: tag, useYn: 'Y', ordNo: 99 } });
    const menuFields = {
      linkSysId: recordId('store_menu_master', 'category_name'), menuName: tag, menuDescription: tag,
      optionUseYn: 'Y', soldOutYn: 'N', useYn: 'Y', ordNo: 99,
    };
    const saveMenu = (kind: 'newItems' | 'updateItems', menuPrice: number, sysId?: string) =>
      post(request, `${menus}/menu/detail/save`, { multipart: { menuDetailRequest: {
        name: 'menuDetailRequest.json', mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify({ [kind]: [{ ...menuFields, sysId, menuPrice }] })),
      } } });
    await saveMenu('newItems', original.menu);
    const menuSysId = recordId('store_menu_detail', 'menu_name');
    const group = { linkSysId: menuSysId, groupName: tag, requiredYn: 'Y', inputType: '01', ordNo: 1 };
    await post(request, `${menus}/option/group/new`, { data: group });
    const optionGroupId = recordId('store_menu_option_group', 'group_name');
    await post(request, `${menus}/option/group/update`, { data: { ...group, sysId: optionGroupId, useYn: 'Y' } });
    const optionFields = {
      linkSysId: optionGroupId, menuOptionName: tag, menuDescription: tag,
      maximumNum: 1, defaultYn: 'N', soldOutYn: 'N', useYn: 'Y', ordNo: 1,
    };
    const saveOption = (kind: 'newItems' | 'updateItems', menuOptionPrice: number, sysId?: string) =>
      post(request, `${menus}/option/detail/save`, { multipart: Object.fromEntries(
        Object.entries({ ...optionFields, ...(sysId ? { sysId } : {}), menuOptionPrice })
          .map(([key, value]) => [`${kind}[0].${key}`, String(value)]),
      ) });
    await saveOption('newItems', original.option);
    const optionSysId = recordId('store_menu_option_detail', 'menu_option_name');

    const catalog = () => db(`select m.menu_price, o.menu_option_price
      from store_menu_detail m cross join store_menu_option_detail o
      where m.sys_id='${menuSysId}' and o.sys_id='${optionSysId}';`);
    const reprice = async (read: () => Promise<void>) => {
      try {
        await saveMenu('updateItems', updated.menu, menuSysId);
        await saveOption('updateItems', updated.option, optionSysId);
        expect(catalog()).toBe(`${updated.menu}|${updated.option}`);
        await read();
      } finally {
        try {
          await saveMenu('updateItems', original.menu, menuSysId);
        } finally {
          await saveOption('updateItems', original.option, optionSysId);
        }
        expect(catalog()).toBe(`${original.menu}|${original.option}`);
        console.log('catalog restored', catalog());
      }
    };

    const createOrder = async (clientRequestId: string) => {
      const buyer = await playwright.request.newContext({ baseURL });
      openedClients.push(buyer);
      const qr = await get<CommonResponse>(buyer, `/api/qr/${qrUrl}`);
      expect(qr.success).toBe(true);
      const session = await get<ConsumerSessionEnvelope>(buyer, `${consumer}/session`);
      expect(session.data).toMatchObject({ sysPlantCd: plant, tableSysId: tableId, orderingAllowed: true });
      const { data } = await post<ConsumerOrderCreateEnvelope>(buyer, orders, { data: {
        clientRequestId, items: [{ menuSysId, quantity, options: [{ optionSysId, quantity: 1 }] }],
      } }, 201);
      expect(data).toMatchObject({ status: 'RECEIVED', totalAmount: originalTotal });
      expect(data.orderId).toMatch(idPattern);
      expect(session.data.consumerSessionId).toMatch(idPattern);
      return { buyer, orderId: data.orderId, visitId: session.data.consumerSessionId };
    };

    const detailIds = ({ orderId }: Order) => `select sys_id from order_detail
      where link_sys_id3='${orderId}' and link_sys_id2='${menuSysId}'`;
    const stored = (order: Order) => db(`select od.qty, coalesce(od.order_unit_price::text, 'NULL'),
      odo.qty, coalesce(odo.order_unit_price::text, 'NULL')
      from order_detail od join order_detail_option odo on odo.link_sys_id=od.sys_id
      where od.sys_id in (${detailIds(order)}) and odo.link_sys_id2='${optionSysId}';`);
    const read = async (label: string, order: Order & { buyer: APIRequestContext }, price: Price, paid: boolean) => {
      const total = (price.menu + price.option) * quantity;
      const menuLine = price.menu * quantity;
      const optionLine = price.option * quantity;
      const { orderId, visitId, buyer } = order;
      if (paid) {
        for (const path of [orders, `${orders}/${orderId}`]) {
          expect(await get(buyer, path, 410)).toMatchObject({ success: false, data: null });
        }
      } else {
        const list = await get<ConsumerOrderListEnvelope>(buyer, orders);
        checkEvidence(`${label} Consumer 목록`, list.data.orders.find((item) => item.orderId === orderId)?.totalAmount, total);
        const { data } = await get<ConsumerOrderDetailEnvelope>(buyer, `${orders}/${orderId}`);
        const item = data.items.find((row) => row.menuSysId === menuSysId);
        const option = item?.options?.find((row) => row.optionSysId === optionSysId);
        checkEvidence(`${label} Consumer 상세`, {
          total: data.totalAmount, unit: item?.unitAmount, line: item?.lineAmount,
          optionUnit: option?.unitAmount, optionLine: option?.lineAmount,
        }, { total, unit: price.menu + price.option, line: total, optionUnit: price.option, optionLine });
      }
      const board = await get<StatusResponse[]>(request, `${status}/search`);
      const boardRows = board.flatMap((group) => group.statusList ?? []).filter((row) => row.header?.sysId === orderId);
      if (paid) {
        checkEvidence(`${label} 주문현황 대상 행`, boardRows.length, 0);
      } else {
        checkEvidence(`${label} 주문현황`, boardRows.map(statusAmounts), [{ total, menu: menuLine, option: optionLine }]);
      }
      for (const path of ['get_payment_complete', 'get_change_order']) {
        const preview = await get<StatusItem>(request, `${status}/${path}?sysId=${orderId}`);
        checkEvidence(`${label} ${path}`, statusAmounts(preview), { total, menu: total, option: optionLine });
      }
      if (!paid) return;

      const historyBody = await get<OrderHistoryResponse>(request, `${history}?orderStatus=02&searchKeyword=&${dates}`);
      checkEvidence(`${label} 주문이력`, {
        master: historyBody.orderMasterHistory?.find((row) => row.sysId === visitId)?.totalPrice,
        details: historyBody.orderDetailHistory?.filter((row) => row.masterSysId === visitId && row.menuName === tag)
          .map(({ menuPrice, menuOption }) => ({ menuPrice, menuOption })),
      }, { master: total, details: [{ menuPrice: total, menuOption: `- ${tag}${price.option}` }] });
      const payments = await get<PaymentInfoMasterResponse[]>(request, `${payment}/history/master/search?paymentStatus=02&${dates}`);
      checkEvidence(`${label} 결제 목록`, payments.filter((row) => row.sysId === visitId)
        .map(({ totalPrice, paymentType }) => ({ totalPrice, paymentType })), [{ totalPrice: total, paymentType: '카드' }]);
      const details = await get<PaymentInfoDetailResponse[]>(request, `${payment}/history/detail/search/${visitId}`);
      const items: PaymentLine[] = JSON.parse(details.find((row) => row.sysId === orderId)?.items ?? '[]');
      const line = items.find((item) => item.menuName === tag);
      checkEvidence(`${label} 결제 상세`, {
        menu: line && { price: line.price, qty: line.qty, totalPrice: line.totalPrice },
        options: line?.options?.map(({ price, qty, totalPrice }) => ({ price, qty, totalPrice })),
      }, {
        menu: { price: price.menu, qty: quantity, totalPrice: menuLine },
        options: [{ price: price.option, qty: quantity, totalPrice: optionLine }],
      });
    };

    const settlement = async () => {
      const result = await get<SettlementResponse>(request, settlementPath);
      const daily = result.dailySales?.find((row) => row.groupDate === day);
      const amounts = [result.totalPrice, result.netPrice, daily?.dayTotalPrice ?? 0, daily?.dayNetPrice ?? 0];
      expect(amounts.every((amount) => typeof amount === 'number')).toBe(true);
      return amounts as number[];
    };
    const pay = async ({ orderId, visitId }: Order) => {
      for (const action of ['go_to_cooking', 'go_to_serving_complete']) {
        await post(request, `${status}/${action}`, { data: { header: { sysId: orderId } } });
      }
      const { header, body, footer } = await get<StatusItem>(request, `${status}/get_payment_complete?sysId=${orderId}`);
      expect(header?.sysId).toBe(visitId);
      await post(request, `${status}/payment_complete`, { data: { paymentType: '카드', header, body, footer } });
      expect(db(`select om.order_status, og.order_status from order_master om join order_group og
        on og.link_sys_id=om.sys_id where om.sys_id='${visitId}' and og.sys_id='${orderId}';`)).toBe('02|04');
    };
    const checkSettlement = async (label: string, baseline: number[], delta: number) => {
      const amounts = await settlement();
      checkEvidence(label, { amounts, deltas: amounts.map((amount, index) => amount - baseline[index]) },
        { amounts: baseline.map((amount) => amount + delta), deltas: baseline.map(() => delta) });
      return amounts;
    };

    const snapshot = await createOrder(requestIds[0]);
    console.log('snapshot IDs', tag, snapshot.visitId, snapshot.orderId);
    const storedOriginal = `${quantity}|${original.menu}|${quantity}|${original.option}`;
    checkEvidence('신규 DB 단가', stored(snapshot), storedOriginal);
    await read('신규 진행 중 / 변경 전', snapshot, original, false);
    await reprice(async () => {
      await read('신규 진행 중 / 가격 변경', snapshot, original, false);
      checkEvidence('신규 진행 중 DB 단가', stored(snapshot), storedOriginal);
    });
    const beforePayment = await settlement();
    await pay(snapshot);
    await read('신규 결제 후 / 변경 전', snapshot, original, true);
    const afterPayment = await checkSettlement('신규 정산 / 결제 반영', beforePayment, originalTotal);
    await reprice(async () => {
      await read('신규 결제 후 / 가격 변경', snapshot, original, true);
      await checkSettlement('신규 정산 / 가격 변경', afterPayment, 0);
      checkEvidence('신규 결제 후 DB 단가', stored(snapshot), storedOriginal);
    });

    const legacy = await createOrder(requestIds[1]);
    expect(legacy.visitId).not.toBe(snapshot.visitId);
    console.log('legacy IDs', tag, legacy.visitId, legacy.orderId);
    db(`begin;
      update order_detail_option set order_unit_price=null where link_sys_id in (${detailIds(legacy)}) and link_sys_id2='${optionSysId}';
      update order_detail set order_unit_price=null where sys_id in (${detailIds(legacy)});
      commit;`);
    expect(stored(legacy)).toBe(`${quantity}|NULL|${quantity}|NULL`);
    console.log('legacy DB', stored(legacy));
    await read('NULL 진행 중 / 변경 전', legacy, original, false);
    await reprice(() => read('NULL 진행 중 / 가격 변경', legacy, updated, false));
    await pay(legacy);
    await read('NULL 결제 후 / 변경 전', legacy, original, true);
    const legacyPaid = await checkSettlement('NULL 정산 / 결제 반영', afterPayment, originalTotal);
    await reprice(async () => {
      await read('NULL 결제 후 / 가격 변경', legacy, updated, true);
      await checkSettlement('NULL 정산 / 가격 변경', legacyPaid, updatedTotal - originalTotal);
    });
    await checkSettlement('단가 복원 후 정산', legacyPaid, 0);
    expect(stored(legacy)).toBe(`${quantity}|NULL|${quantity}|NULL`);
    checkEvidence('최종 신규 DB 단가', stored(snapshot), storedOriginal);
  } finally {
    try {
      const fixtureRows = Object.entries(targets);
      const ownedRequests = `sys_plant_cd='${plant}' and client_request_id in ('${requestIds.join("','")}')`;
      // Keep IDs after deleting parent rows so the final counts also detect orphaned rows.
      const idsFrom = (query: string) => {
        const ids = db(query).split(/\r?\n/).filter(Boolean);
        for (const id of ids) expect(id).toMatch(idPattern);
        return ids.length ? ids.map((id) => `'${id}'`).join(',') : 'null';
      };
      const visitIds = idsFrom(visits);
      const visitScope = `link_sys_id in (${visitIds})`;
      const detailIds = idsFrom(`select sys_id from order_detail where ${visitScope}`);
      const optionScope = `link_sys_id in (${detailIds})`;
      const masterScope = `sys_id in (${visitIds})`;
      const auditScopes = fixtureRows.map(([table, where]) => `(table_nm='${table}'
        and ref_key in (${idsFrom(`select sys_id from ${table} where ${where}`)}))`).join(' or ');
      const checks = [
        `select count(*) from order_detail_option where ${optionScope}`,
        `select count(*) from order_detail where ${visitScope}`,
        `select count(*) from order_group where ${visitScope}`,
        `select count(*) from order_master where ${masterScope}`,
        `select count(*) from consumer_order_idempotency where ${ownedRequests}`,
        `select count(*) from sys_audit_trail where ${auditScopes}`,
        ...fixtureRows.map(([table, where]) => `select count(*) from ${table} where ${where}`),
      ];
      db(`begin;
        delete from consumer_order_idempotency where ${ownedRequests};
        delete from order_detail_option where ${optionScope};
        delete from order_detail where ${visitScope};
        delete from order_group where ${visitScope};
        delete from order_master where ${masterScope};
        delete from sys_audit_trail where ${auditScopes};
        ${fixtureRows.reverse().map(([table, where]) => `delete from ${table} where ${where};`).join('\n')}
        commit;`);
      const remaining = db(checks.join(';\n')).split(/\r?\n/);
      expect(remaining).toEqual(checks.map(() => '0'));
      console.log(`${tag} / 정리 후 행 수 ${remaining.join('|')}`);
    } finally {
      await Promise.all(openedClients.map((client) => client.dispose()));
    }
  }
});
