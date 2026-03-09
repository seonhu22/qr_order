package htms.Initial.common.repository;

import htms.Initial.common.dto.CommonCombo;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface CommonComboMapper {
    public List<CommonCombo> getCommonComboCommonCd(String commonCd, String sysPlantCd);
    public List<CommonCombo> getCommonComboSysId(Long sysId, String sysPlantCd);
}
