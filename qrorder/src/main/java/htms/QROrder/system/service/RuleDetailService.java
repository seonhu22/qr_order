package htms.QROrder.system.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.audit.service.AuditService;
import htms.QROrder.common.exception.DuplicateException;
import htms.QROrder.system.domain.AdminUser;
import htms.QROrder.system.domain.RuleDetail;
import htms.QROrder.system.domain.RuleMaster;
import htms.QROrder.system.dto.AdminUserResponse;
import htms.QROrder.system.dto.RuleDetailRequest;
import htms.QROrder.system.repository.RuleDetailMapper;
import htms.QROrder.system.repository.RuleMasterMapper;
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
public class RuleDetailService {

    private final RuleDetailMapper ruleDetailMapper;
    private final AuditService auditService;

    public List<RuleDetail> getRuleDetail(String sysId) {

        return ruleDetailMapper.getRuleDetail(sysId);
    }

    public void saveRuleDetail(RuleDetailRequest ruleDetailRequest,
                                    String userId,
                                    String sysPlantCd,
                                    String menuCd) {

        List<RuleDetail> newItems = ruleDetailRequest.getNewItems();
        List<RuleDetail> updateItems = ruleDetailRequest.getUpdateItems();
        List<RuleDetail> delItems = ruleDetailRequest.getDelItems();

        if(!newItems.isEmpty()){
            if(duplicateChk(newItems)) {
                List<RuleDetail> deuplicateData = getDuplicateData(newItems);

                String result = deuplicateData.stream()
                        .map(u -> u.getOptionNm() + "(" + u.getOptionCd() + ")")
                        .collect(Collectors.joining(", "));

                throw new DuplicateException("중복된 데이터가 존재합니다.\n" + result);
            }

            newItems.forEach(ruleDetail -> {
                ruleDetail.setSysId(UlidCreator.getUlid().toString());
            });

            newRuleDetail(userId, sysPlantCd, menuCd, newItems);
        }

        if(!updateItems.isEmpty()){

            updateRuleDetail(userId, sysPlantCd, menuCd, updateItems);
        }

        if(!delItems.isEmpty()){

            delRuleDetail(userId, sysPlantCd, menuCd, delItems);
        }
    }

    private void delRuleDetail(String userId,
                                String sysPlantCd,
                                String menuCd,
                                List<RuleDetail> delItems) {

        auditService.insertDeleteAuditTrailData(delItems, menuCd, "sys_rule_detail", userId, sysPlantCd);
        ruleDetailMapper.delRuleDetail(delItems, userId, sysPlantCd);
    }

    private void updateRuleDetail(String userId,
                                    String sysPlantCd,
                                    String menuCd,
                                    List<RuleDetail> updateItems) {

        List<RuleDetail> oldData = getOldData(updateItems);

        auditService.insertUpdateAuditTrailData(oldData, updateItems, menuCd, "sys_rule_detail", userId, sysPlantCd);
        ruleDetailMapper.updateRuleDetail(updateItems, userId, sysPlantCd);
    }

    private void newRuleDetail(String userId,
                                String sysPlantCd,
                                String menuCd,
                                List<RuleDetail> newItems) {

        auditService.insertNewAuditTrailData(newItems, menuCd, "sys_rule_detail", userId, sysPlantCd);
        ruleDetailMapper.newRuleDetail(newItems, userId, sysPlantCd);
    }

    private boolean duplicateChk(List<RuleDetail> ruleDetails) {

        return ruleDetailMapper.duplicateChk(ruleDetails);
    }

    private List<RuleDetail> getDuplicateData(List<RuleDetail> ruleDetail) {

        return ruleDetailMapper.getDuplicateData(ruleDetail);
    }

    private List<RuleDetail> getOldData(List<RuleDetail> ruleDetail) {

        return ruleDetailMapper.getOldData(ruleDetail);
    }
}
