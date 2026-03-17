package htms.QROrder.system.repository;

import htms.QROrder.system.domain.RuleMaster;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface RuleMasterMapper {
    List<RuleMaster> getRuleMaster(String searchKeyword);
    void newRuleMaster(RuleMaster ruleMaster, String userId, String sysPlantCd);
    void updateRuleMaster(RuleMaster ruleMaster, String userId, String sysPlantCd);
    void delRuleMaster(List<RuleMaster> ruleMaster, String userId, String sysPlantCd);
}
