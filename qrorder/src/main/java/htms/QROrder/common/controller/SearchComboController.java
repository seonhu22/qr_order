package htms.QROrder.common.controller;

import htms.QROrder.common.dto.Combo;
import htms.QROrder.common.service.ComboService;
import htms.QROrder.common.service.SearchComboService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/search_combo")
public class SearchComboController {

    private final SearchComboService searchComboService;

    @GetMapping("/common")
    public List<Combo> getSearchCommonCombo(@RequestParam String code) {

        return searchComboService.getSearchCommonCombo(code);
    }
}
