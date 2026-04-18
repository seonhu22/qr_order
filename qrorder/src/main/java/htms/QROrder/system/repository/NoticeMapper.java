package htms.QROrder.system.repository;

import htms.QROrder.system.domain.AdminUser;
import htms.QROrder.system.domain.CommonMaster;
import htms.QROrder.system.dto.AdminUserResponse;
import htms.QROrder.system.dto.NoticeRequest;
import htms.QROrder.system.dto.NoticeResponse;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface NoticeMapper {
    List<NoticeResponse> getNotice(String searchKeyword, String sysPlantCd);
    void newNotice(NoticeRequest noticeRequest, String userId, String sysPlantCd);
    void updateNotice(NoticeRequest noticeRequest, String userId, String sysPlantCd);
    void delNotice(List<NoticeRequest> noticeRequest, String userId, String sysPlantCd);
    NoticeResponse getOldData(String sysId);
}
