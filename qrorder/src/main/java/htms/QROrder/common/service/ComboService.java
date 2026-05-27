package htms.QROrder.common.service;

import htms.QROrder.common.dto.Combo;
import htms.QROrder.common.repository.ComboMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class ComboService {

    private final ComboMapper comboMapper;

    public List<Combo> getCommonCombo(String code) {

        return comboMapper.getCommonCombo(code);
    }

    public List<Combo> getPlantCombo() {

        return comboMapper.getPlantCombo();
    }
}
