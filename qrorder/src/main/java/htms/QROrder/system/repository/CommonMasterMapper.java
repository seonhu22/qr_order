package htms.QROrder.system.repository;

import htms.QROrder.system.domain.CommonMaster;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface CommonMasterMapper {
    List<CommonMaster> findCommonBySearchCond(String searchCond);
    void newCommonMaster(CommonMaster commonMaster,  String userId);
    void delCommonMasterByCheckCond(List<String> ids, String userId);
    void updateCommonMaster(CommonMaster commonMaster, String userId);
    boolean checkDuplicate(CommonMaster commonMaster);
    CommonMaster getOldData(String sysId);
}
