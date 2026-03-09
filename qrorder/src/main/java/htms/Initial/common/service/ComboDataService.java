package htms.Initial.common.service;

import htms.Initial.common.dto.CommonComboData;
import htms.Initial.common.repository.ComboDataMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class ComboDataService {
    private final ComboDataMapper comboDataMapper;

    public List<CommonComboData> searchComboDept(String sysPlantCd) {

        return comboDataMapper.searchComboDept(sysPlantCd);
    }

    public List<CommonComboData> searchComboPlant() {

        return comboDataMapper.searchComboPlant();
    }

    public List<CommonComboData> searchComboRank(String sysPlantCd) {

        return comboDataMapper.searchComboRank(sysPlantCd);
    }
}
