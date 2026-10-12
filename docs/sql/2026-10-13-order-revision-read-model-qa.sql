-- 주문 수정 제거 이력이 6개 조회 Mapper에 일관되게 반영되는지 검증한다.
-- 실제 PostgreSQL/DBeaver 전용이다. 전체 스크립트를 한 번에 실행하며 마지막은 항상 ROLLBACK이다.
-- 운영 DB에서는 실행하지 않는다. 실행 중 오류가 나면 수동으로 ROLLBACK을 실행한다.
BEGIN;

DO $$
BEGIN
    IF to_regclass('public.client_order_revision') IS NULL
       OR to_regclass('public.client_order_revision_removed_detail') IS NULL THEN
        RAISE EXCEPTION '주문 수정 migration을 먼저 적용해야 합니다.';
    END IF;
END $$;

-- 같은 매장에서 메뉴가 2개 이상인 진행 주문 1건과 별도 진행 주문 1건을 자동 선택한다.
CREATE TEMP TABLE qa_revision_target ON COMMIT DROP AS
WITH eligible AS (
    SELECT og.sys_plant_cd, og.link_sys_id AS master_id, om.link_sys_id AS table_id,
           og.sys_id AS group_id, MIN(od.sys_id) AS first_detail, COUNT(*) AS detail_count
    FROM order_group og
    JOIN order_master om ON om.sys_id = og.link_sys_id
    JOIN order_detail od ON od.link_sys_id3 = og.sys_id
    WHERE og.order_status IN ('01', '02')
      AND NOT EXISTS (
          SELECT 1 FROM client_order_revision_removed_detail r
          WHERE r.order_detail_sys_id = od.sys_id
      )
    GROUP BY og.sys_plant_cd, og.link_sys_id, om.link_sys_id, og.sys_id
), partial_target AS (
    SELECT * FROM eligible WHERE detail_count >= 2 ORDER BY group_id LIMIT 1
), all_target AS (
    SELECT e.* FROM eligible e JOIN partial_target p USING (sys_plant_cd)
    WHERE e.group_id <> p.group_id ORDER BY e.group_id LIMIT 1
)
SELECT p.sys_plant_cd, p.master_id AS partial_master_id, p.table_id AS partial_table_id,
       p.group_id AS partial_group_id, p.first_detail AS partial_removed_detail_id,
       a.master_id AS all_master_id, a.table_id AS all_table_id, a.group_id AS all_group_id
FROM partial_target p JOIN all_target a USING (sys_plant_cd);

DO $$
BEGIN
    IF (SELECT COUNT(*) FROM qa_revision_target) <> 1 THEN
        RAISE EXCEPTION '같은 매장에 진행 주문 2건, 그중 메뉴 2개 이상 주문 1건이 필요합니다.';
    END IF;
END $$;

CREATE TEMP TABLE qa_payment_before ON COMMIT DROP AS
SELECT od.sys_id, od.payment_yn
FROM order_detail od
JOIN qa_revision_target q
  ON od.sys_id = q.partial_removed_detail_id OR od.link_sys_id3 = q.all_group_id;

INSERT INTO client_order_revision (
    sys_id, sys_plant_cd, client_request_id, order_master_id, table_sys_id,
    request_fingerprint, processing_status, response_json, insert_user_id,
    insert_datetime, complete_datetime
)
SELECT 'QA-REV-PARTIAL-20261013', sys_plant_cd,
       '00000000-0000-4000-8000-000000000001', partial_master_id, partial_table_id,
       repeat('a', 64), 'COMPLETED', '{}'::jsonb, 'QA', now(), now()
FROM qa_revision_target
UNION ALL
SELECT 'QA-REV-ALL-20261013', sys_plant_cd,
       '00000000-0000-4000-8000-000000000002', all_master_id, all_table_id,
       repeat('b', 64), 'COMPLETED', '{}'::jsonb, 'QA', now(), now()
FROM qa_revision_target;

INSERT INTO client_order_revision_removed_detail (revision_sys_id, order_detail_sys_id)
SELECT 'QA-REV-PARTIAL-20261013', partial_removed_detail_id FROM qa_revision_target
UNION ALL
SELECT 'QA-REV-ALL-20261013', od.sys_id
FROM order_detail od JOIN qa_revision_target q ON q.all_group_id = od.link_sys_id3;

UPDATE order_group og
SET order_status = '99!', cancel_yn = 'Y', cancel_type = 'ORDER_REVISION',
    cancel_reason = '주문 수정으로 모든 메뉴 제거', cancel_datetime = now()
FROM qa_revision_target q WHERE og.sys_id = q.all_group_id;

-- StatusMapper/ConsumerOrderMapper: 부분 제거는 1개만 숨고, 전체 제거 header는 존재하지 않아야 한다.
SELECT q.partial_group_id,
       COUNT(*) FILTER (WHERE r.order_detail_sys_id IS NULL) AS visible_menu_count,
       COUNT(*) FILTER (WHERE r.order_detail_sys_id IS NOT NULL) AS removed_menu_count
FROM qa_revision_target q
JOIN order_detail od ON od.link_sys_id3 = q.partial_group_id
LEFT JOIN client_order_revision_removed_detail r ON r.order_detail_sys_id = od.sys_id
GROUP BY q.partial_group_id;

SELECT q.all_group_id,
       EXISTS (
           SELECT 1 FROM order_detail od
           WHERE od.link_sys_id3 = q.all_group_id
             AND NOT EXISTS (SELECT 1 FROM client_order_revision_removed_detail r
                             WHERE r.order_detail_sys_id = od.sys_id)
       ) AS consumer_header_visible
FROM qa_revision_target q;

-- StatusMapper/ConsumerOrderMapper/OrderHistoryMapper: OPTION은 살아있는 parent만 남아야 한다.
SELECT COUNT(*) FILTER (WHERE r.order_detail_sys_id IS NULL) AS visible_option_count,
       COUNT(*) FILTER (WHERE r.order_detail_sys_id IS NOT NULL) AS removed_parent_option_count
FROM qa_revision_target q
JOIN order_detail od ON od.link_sys_id3 IN (q.partial_group_id, q.all_group_id)
JOIN order_detail_option odo ON odo.link_sys_id = od.sys_id
LEFT JOIN client_order_revision_removed_detail r ON r.order_detail_sys_id = od.sys_id;

-- PaymentInfoMaster/Detail과 OrderHistory: 표시/합계 대상은 제거되지 않은 메뉴만 사용한다.
SELECT og.link_sys_id AS master_id,
       COUNT(*) FILTER (WHERE r.order_detail_sys_id IS NULL) AS visible_items,
       COALESCE(SUM(CASE WHEN r.order_detail_sys_id IS NULL
                    THEN smd.menu_price * od.qty ELSE 0 END), 0) AS visible_menu_amount
FROM qa_revision_target q
JOIN order_group og ON og.link_sys_id IN (q.partial_master_id, q.all_master_id)
JOIN order_detail od ON od.link_sys_id3 = og.sys_id
JOIN store_menu_detail smd ON smd.sys_id = od.link_sys_id2
LEFT JOIN client_order_revision_removed_detail r ON r.order_detail_sys_id = od.sys_id
GROUP BY og.link_sys_id ORDER BY og.link_sys_id;

-- SettlementMapper: ORDER_REVISION 취소 건수는 유지하고 제거 금액 기여는 0이어야 한다.
SELECT q.all_group_id,
       COUNT(DISTINCT CASE WHEN og.order_status = '99!' THEN og.sys_id END) AS cancel_count,
       COALESCE(SUM(CASE WHEN og.order_status = '99!' AND r.order_detail_sys_id IS NULL
                    THEN smd.menu_price * od.qty ELSE 0 END), 0) AS cancel_amount
FROM qa_revision_target q
JOIN order_group og ON og.sys_id = q.all_group_id
JOIN order_detail od ON od.link_sys_id3 = og.sys_id
JOIN store_menu_detail smd ON smd.sys_id = od.link_sys_id2
LEFT JOIN client_order_revision_removed_detail r ON r.order_detail_sys_id = od.sys_id
GROUP BY q.all_group_id;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM qa_payment_before b JOIN order_detail od ON od.sys_id = b.sys_id
        WHERE od.payment_yn IS DISTINCT FROM b.payment_yn
    ) THEN RAISE EXCEPTION 'payment_yn이 변경되었습니다.'; END IF;
    IF EXISTS (
        SELECT 1 FROM qa_revision_target q JOIN order_detail od ON od.link_sys_id3 = q.all_group_id
        WHERE NOT EXISTS (SELECT 1 FROM client_order_revision_removed_detail r
                          WHERE r.order_detail_sys_id = od.sys_id)
    ) THEN RAISE EXCEPTION '전체 제거 fixture에 살아있는 상세가 남았습니다.'; END IF;
END $$;

ROLLBACK;
