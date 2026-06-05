package htms.QROrder.common.service;

import htms.QROrder.common.dto.Combo;
import htms.QROrder.common.repository.ComboMapper;
import htms.QROrder.common.repository.SearchComboMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class SearchComboService {

    private final SearchComboMapper searchComboMapper;

    public List<Combo> getSearchCommonCombo(String code) {

        return searchComboMapper.getSearchCommonCombo(code);
    }
}
