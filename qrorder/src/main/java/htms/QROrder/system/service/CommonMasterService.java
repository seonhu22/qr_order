package htms.QROrder.system.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.audit.service.AuditService;
import htms.QROrder.common.exception.DuplicateException;
import htms.QROrder.system.domain.CommonMaster;
import htms.QROrder.system.repository.CommonMasterMapper;
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
public class CommonMasterService {
    private final CommonMasterMapper commonMasterMapper;
    private final AuditService auditService;

    public List<CommonMaster> findCommonBySearchCond(String searchCond) {
        return commonMasterMapper.findCommonBySearchCond(searchCond);
    }

    public void newCommonMaster(CommonMaster commonMaster,
                                String userId,
                                String sysPlantCd,
                                String menuCd) {

        log.info(
                "CommonMasterService.newCommonMaster start commonCd={}, commonNm={}, useYn={}, userId={}, sysPlantCd={}, menuCd={}",
                commonMaster.getCommonCd(),
                commonMaster.getCommonNm(),
                commonMaster.getUseYn(),
                userId,
                sysPlantCd,
                menuCd
        );

        boolean duplicated = checkDuplicate(commonMaster);
        log.info("CommonMasterService.newCommonMaster duplicateCheck result={}", duplicated);

        if(duplicated) {
            throw new DuplicateException("이미 존재하는 데이터입니다.");
        }
        else {
            commonMaster.setSysId(UlidCreator.getMonotonicUlid().toString());
            log.info("CommonMasterService.newCommonMaster generated sysId={}", commonMaster.getSysId());

            auditService.insertNewAuditTrailData(commonMaster, commonMaster.getSysId(), menuCd, "sys_common_master", userId, sysPlantCd);
            log.info("CommonMasterService.newCommonMaster audit insert completed sysId={}", commonMaster.getSysId());

            commonMasterMapper.newCommonMaster(commonMaster, userId);
            log.info("CommonMasterService.newCommonMaster master insert completed sysId={}", commonMaster.getSysId());
        }
    }

    public void delCommonMasterByCheckCond(List<CommonMaster> commonMasters,
                                            String userId,
                                            String sysPlantCd,
                                            String menuCd) {

        List<String> ids = commonMasters.stream().map(CommonMaster::getSysId).collect(Collectors.toList());
        auditService.insertDeleteAuditTrailData(commonMasters, menuCd, "sys_common_master", userId, sysPlantCd);
        commonMasterMapper.delCommonMasterByCheckCond(ids, userId);
    }

    public void updateCommonMaster(CommonMaster commonMaster,
                                    String userId,
                                    String sysPlantCd,
                                    String menuCd) {

        CommonMaster oldData = commonMasterMapper.getOldData(commonMaster.getSysId());
        auditService.insertUpdateAuditTrailData(oldData, commonMaster, commonMaster.getSysId(),  menuCd, "sys_common_master", userId, sysPlantCd);
        commonMasterMapper.updateCommonMaster(commonMaster, userId);
    }

    public boolean checkDuplicate(CommonMaster commonMaster) {

        return commonMasterMapper.checkDuplicate(commonMaster);
    }
}
