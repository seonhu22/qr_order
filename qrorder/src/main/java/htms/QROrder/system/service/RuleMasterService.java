package htms.QROrder.system.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.common.exception.DuplicateException;
import htms.QROrder.system.domain.Payment;
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

    public List<RuleMaster> getRuleMaster(String searchKeyword) {

        return ruleMasterMapper.getRuleMaster(searchKeyword);
    }

    public void newRuleMaster(RuleMaster ruleMaster,
                                String userId,
                                String sysPlantCd) {

        if(duplicateChk(ruleMaster)) {
            throw new DuplicateException("이미 존재하는 데이터입니다.");
        }

        ruleMaster.setSysId(UlidCreator.getUlid().toString());

        ruleMasterMapper.newRuleMaster(ruleMaster, userId, sysPlantCd);
    }

    public void updateRuleMaster(RuleMaster ruleMaster,
                                    String userId,
                                    String sysPlantCd) {

        ruleMasterMapper.updateRuleMaster(ruleMaster, userId, sysPlantCd);
    }

    public void delRuleMaster(List<RuleMaster> ruleMaster,
                                    String userId,
                                    String sysPlantCd) {

        ruleMasterMapper.delRuleMaster(ruleMaster, userId, sysPlantCd);
    }

    public boolean duplicateChk(RuleMaster ruleMaster) {

        return ruleMasterMapper.duplicateChk(ruleMaster);
    }
}
