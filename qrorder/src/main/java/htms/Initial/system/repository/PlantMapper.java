package htms.Initial.system.repository;

import htms.Initial.system.domain.Plant;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;
import java.util.Map;

@Mapper
public interface PlantMapper {
    List<Plant> findPlantBySearchCond(String searchCond);
    void delPlantByCheckCond(List<String> ids, String userId);
    void newPlant(Plant plant, String userId);
    void updatePlant(Plant plant, String userId);
    boolean checkDuplicate(Plant plant);
    Plant getOldData(String sysId);
}
