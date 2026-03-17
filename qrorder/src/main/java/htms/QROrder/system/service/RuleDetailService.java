package htms.QROrder.system.service;

import com.github.f4b6a3.ulid.UlidCreator;
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

    public List<RuleDetail> getRuleDetail(String sysId) {

        return ruleDetailMapper.getRuleDetail(sysId);
    }

    public void saveRuleDetail(RuleDetailRequest ruleDetailRequest,
                                    String userId,
                                    String sysPlantCd) {

        List<RuleDetail> newItems = ruleDetailRequest.getNewItems();
        List<RuleDetail> updateItems = ruleDetailRequest.getUpdateItems();
        List<RuleDetail> delItems = ruleDetailRequest.getDelItems();

        if(duplicateChk(newItems)){
            List<RuleDetail> deuplicateData = getDeuplicateData(newItems);

            String result = deuplicateData.stream()
                .map(u -> u.getOptionNm() + "(" + u.getOptionCd() + ")")
                .collect(Collectors.joining(", "));

            throw new DuplicateException("중복된 데이터가 존재합니다.\n" + result);
        }

        if(!newItems.isEmpty()){

            newItems.forEach(ruleDetail -> {
                ruleDetail.setSysId(UlidCreator.getUlid().toString());
            });

            ruleDetailMapper.newRuleDetail(newItems, userId, sysPlantCd);
        }

        if(!updateItems.isEmpty()){

            ruleDetailMapper.updateRuleDetail(updateItems, userId, sysPlantCd);
        }

        if(!delItems.isEmpty()){

            ruleDetailMapper.delRuleDetail(delItems, userId, sysPlantCd);
        }
    }

    public boolean duplicateChk(List<RuleDetail> ruleDetails) {

        return ruleDetailMapper.duplicateChk(ruleDetails);
    }

    public List<RuleDetail> getDeuplicateData(List<RuleDetail> ruleDetail) {

        return ruleDetailMapper.getDeuplicateData(ruleDetail);
    }
}
