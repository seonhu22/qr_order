package htms.QROrder.client.repository;

import htms.QROrder.client.dto.StaffCallSettingItem;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface StaffCallSettingMapper {
    List<StaffCallSettingItem> findAll(String sysPlantCd);
    boolean existsCommonCode(String callCd);
    boolean existsByCallCd(String sysPlantCd, String callCd, String excludeSysId);
    boolean belongsToPlant(String sysPlantCd, String sysId);
    void insert(StaffCallSettingItem item, String sysPlantCd);
    void update(StaffCallSettingItem item, String sysPlantCd);
    void delete(String sysId, String sysPlantCd);
}
