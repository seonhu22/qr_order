package htms.Initial.common.service;

import htms.Initial.common.dto.CommonCombo;
import htms.Initial.common.repository.CommonComboMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class CommonComboService {
    private final CommonComboMapper commonComboMapper;

    public List<CommonCombo> getCommonComboCommonCd(String commonCd, String sysPlantCd) {
        return commonComboMapper.getCommonComboCommonCd(commonCd,  sysPlantCd);
    }

    public List<CommonCombo> getCommonComboSysId(Long sysId, String sysPlantCd) {
        return commonComboMapper.getCommonComboSysId(sysId,  sysPlantCd);
    }
}
