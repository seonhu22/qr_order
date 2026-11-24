package htms.QROrder.common.dto;

import htms.QROrder.auth.domain.Login;

/**
 * 첨부 읽기 범위. 첨부는 부모 행을 읽을 수 있는 세션만 읽는다 (FileMapper.xml readScope).
 *
 * @param sysPlantCd   세션 매장. 같은 매장의 살아 있는 부모(문의/공지/메뉴/옵션) 첨부를 읽는다.
 * @param admin        시스템 관리자(ADMIN 매장). 모든 매장의 Client 문의 원문/답변 첨부를 읽는다.
 * @param noticeTarget Client 공지 대상(manager/staff). 공지 목록과 같은 조건의 공지 첨부를 읽는다. 없으면 null.
 */
public record AttachReadScope(String sysPlantCd, boolean admin, String noticeTarget) {

    private static final String ADMIN_PLANT = "ADMIN";

    public static AttachReadScope of(Login login) {
        if (login == null || login.getSysPlantCd() == null || login.getSysPlantCd().isBlank()) {
            return new AttachReadScope(null, false, null);
        }
        String plant = login.getSysPlantCd();
        if (ADMIN_PLANT.equals(plant)) {
            return new AttachReadScope(plant, true, null);
        }
        // ClientNoticeService.getNotice 와 같은 역할 대응: 01 매장 관리자, 02 직원.
        String noticeTarget = "01".equals(login.getUserRole()) ? "manager"
                : "02".equals(login.getUserRole()) ? "staff" : null;
        return new AttachReadScope(plant, false, noticeTarget);
    }
}
