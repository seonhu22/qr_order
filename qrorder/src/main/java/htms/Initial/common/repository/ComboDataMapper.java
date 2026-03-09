package htms.Initial.common.repository;

import htms.Initial.common.dto.CommonComboData;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface ComboDataMapper {
    public List<CommonComboData> searchComboDept(String sysPlantCd);
    public List<CommonComboData> searchComboPlant();
    public List<CommonComboData> searchComboRank(String sysPlantCd);
}
