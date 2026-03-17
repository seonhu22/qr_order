package htms.QROrder.system.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.audit.service.AuditService;
import htms.QROrder.common.exception.DuplicateException;
import htms.QROrder.system.domain.Plant;
import htms.QROrder.system.repository.PlantMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class PlantService {
    private final PlantMapper plantMapper;
    private final AuditService auditService;

    public List<Plant> findPlantBySearchCond(String searchCond) {
        return plantMapper.findPlantBySearchCond(searchCond);
    }

    public void delPlantByCheckCond(List<Plant> plants,
                                    String userId,
                                    String sysPlantCd,
                                    String menuCd) {

        List<String> ids = plants.stream().map(Plant::getSysId).collect(Collectors.toList());

        auditService.insertDeleteAuditTrailData(plants, menuCd, "sys_plant", userId, sysPlantCd);
        plantMapper.delPlantByCheckCond(ids, userId);
    }

    public void newPlant(Plant plant,
                            String userId,
                            String sysPlantCd,
                            String menuCd) {
        if(checkDuplicate(plant)) {
            throw new DuplicateException("이미 존재하는 사업장 코드입니다.");
        }

        String ULID = UlidCreator.getMonotonicUlid().toString();
        plant.setSysId(ULID);

        auditService.insertNewAuditTrailData(plant, ULID, menuCd, "sys_plant", userId, sysPlantCd);
        plantMapper.newPlant(plant, userId);
    }

    public void updatePlant(Plant plant,
                            String userId,
                            String sysPlantCd,
                            String menuCd) {

        Plant oldPlant = getOldData(plant.getSysId());

        auditService.insertUpdateAuditTrailData(oldPlant, plant, plant.getSysId(), menuCd, "sys_plant", userId, sysPlantCd);
        plantMapper.updatePlant(plant, userId);
    }

    public boolean checkDuplicate(Plant plant) {

        return plantMapper.checkDuplicate(plant);
    }

    public Plant getOldData(String sysId) {

        return plantMapper.getOldData(sysId);
    }
}
