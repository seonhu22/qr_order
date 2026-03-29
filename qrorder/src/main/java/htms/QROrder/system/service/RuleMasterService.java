package htms.QROrder.system.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.audit.service.AuditService;
import htms.QROrder.common.exception.DuplicateException;
import htms.QROrder.system.domain.Payment;
import htms.QROrder.system.domain.RuleDetail;
import htms.QROrder.system.domain.RuleMaster;
import htms.QROrder.system.repository.RuleMasterMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class RuleMasterService {

    private final RuleMasterMapper ruleMasterMapper;
    private final AuditService auditService;

    public List<RuleMaster> getRuleMaster(String searchKeyword) {

        return ruleMasterMapper.getRuleMaster(searchKeyword);
    }

    public void newRuleMaster(RuleMaster ruleMaster,
                                String userId,
                                String sysPlantCd,
                                String menuCd) {

        if(duplicateChk(ruleMaster)) {
            RuleMaster duplicateData = getDuplicateData(ruleMaster);
            String result = duplicateData.getRuleNm() + "(" + duplicateData.getRuleCd() + ")";

            throw new DuplicateException("중복된 데이터가 존재합니다.\n" + result);
        }

        ruleMaster.setSysId(UlidCreator.getUlid().toString());

        auditService.insertNewAuditTrailData(ruleMaster, ruleMaster.getSysId(), menuCd, "sys_rule_master", userId, sysPlantCd);
        ruleMasterMapper.newRuleMaster(ruleMaster, userId, sysPlantCd);
    }

    public void updateRuleMaster(RuleMaster ruleMaster,
                                    String userId,
                                    String sysPlantCd,
                                    String menuCd) {

        RuleMaster oldData = getOldData(ruleMaster);

        auditService.insertUpdateAuditTrailData(oldData, ruleMaster, ruleMaster.getSysId(), menuCd, "sys_rule_master", userId, sysPlantCd);
        ruleMasterMapper.updateRuleMaster(ruleMaster, userId, sysPlantCd);
    }

    public void delRuleMaster(List<RuleMaster> ruleMaster,
                                String userId,
                                String sysPlantCd,
                                String menuCd) {

        auditService.insertDeleteAuditTrailData(ruleMaster, menuCd, "sys_rule_master", userId, sysPlantCd);
        ruleMasterMapper.delRuleMaster(ruleMaster, userId, sysPlantCd);
    }

    private boolean duplicateChk(RuleMaster ruleMaster) {

        return ruleMasterMapper.duplicateChk(ruleMaster);
    }

    private RuleMaster getDuplicateData(RuleMaster ruleMaster) {

        return ruleMasterMapper.getDuplicateData(ruleMaster);
    }

    private RuleMaster getOldData(RuleMaster ruleMaster) {

        return ruleMasterMapper.getOldData(ruleMaster);
    }
}
