package htms.QROrder.system.repository;

import htms.QROrder.system.domain.CommonDetail;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface CommonDetailMapper {
    List<CommonDetail> findCommonDetailBySearchCond(String linkSysId, String searchCond);
    void newCommonDetail(List<CommonDetail> commonDetail, String userId);
    void delCommonDetail(List<String> ids, String userId);
    void updateCommonDetail(List<CommonDetail> commonDetail, String userId);
    boolean checkDuplicate(List<CommonDetail> commonDetail, String tempLinkSysId);
    List<CommonDetail> getOldData(List<CommonDetail> commonDetails);
}
