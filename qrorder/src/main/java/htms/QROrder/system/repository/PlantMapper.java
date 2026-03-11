package htms.QROrder.system.repository;

import htms.QROrder.system.domain.Plant;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface PlantMapper {
    List<Plant> findPlantBySearchCond(String searchCond);
    void delPlantByCheckCond(List<String> ids, String userId);
    void newPlant(Plant plant, String userId);
    void updatePlant(Plant plant, String userId);
    boolean checkDuplicate(Plant plant);
    Plant getOldData(String sysId);
}
