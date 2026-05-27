package htms.QROrder.common.controller;

import htms.QROrder.common.dto.Combo;
import htms.QROrder.common.service.ComboService;
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
@RequestMapping("/api/combo")
public class ComboController {

    private final ComboService comboService;

    @GetMapping("/common")
    public List<Combo> getCommonCombo(@RequestParam String code) {

        return comboService.getCommonCombo(code);
    }

    @GetMapping("/plant")
    public List<Combo> getPlantCombo() {

        return comboService.getPlantCombo();
    }
}
