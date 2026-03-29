package htms.QROrder.system.repository;

import htms.QROrder.system.domain.AdminUser;
import htms.QROrder.system.domain.RuleDetail;
import htms.QROrder.system.domain.RuleMaster;
import htms.QROrder.system.dto.AdminUserResponse;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface RuleDetailMapper {
    List<RuleDetail> getRuleDetail(String sysId);
    void newRuleDetail(List<RuleDetail> insertItems, String userId, String sysPlantCd);
    void updateRuleDetail(List<RuleDetail> updateItems, String userId, String sysPlantCd);
    void delRuleDetail(List<RuleDetail> delItems, String userId, String sysPlantCd);
    boolean duplicateChk(List<RuleDetail> ruleDetail);
    List<RuleDetail> getDuplicateData(List<RuleDetail> ruleDetail);
    List<RuleDetail> getOldData(List<RuleDetail> ruleDetail);
}
