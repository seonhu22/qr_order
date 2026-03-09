package htms.Initial.common.controller;

import htms.Initial.auth.domain.Login;
import htms.Initial.common.dto.CommonComboData;
import htms.Initial.common.service.ComboDataService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@Controller
@ControllerAdvice
@RequiredArgsConstructor
@RequestMapping("/common/combodata")
public class CommonComboDataController {
    private final ComboDataService comboDataService;

    @GetMapping("/dept")
    @ResponseBody
    public List<CommonComboData> searchComboDept(HttpSession session) {

        Login login = (Login) session.getAttribute("loginUser");

        return comboDataService.searchComboDept(login.getSysPlantCd());
    }

    @GetMapping("/plant")
    @ResponseBody
    public List<CommonComboData> searchComboPlant() {

        return comboDataService.searchComboPlant();
    }

    @GetMapping("/rank")
    @ResponseBody
    public List<CommonComboData> searchComboRank(HttpSession session) {

        Login login = (Login) session.getAttribute("loginUser");

        return comboDataService.searchComboRank(login.getSysPlantCd());
    }
}
