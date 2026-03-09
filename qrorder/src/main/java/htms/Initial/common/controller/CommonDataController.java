package htms.Initial.common.controller;

import htms.Initial.auth.domain.Login;
import htms.Initial.common.dto.*;
import htms.Initial.common.service.CommonDataService;
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
@RequestMapping("/common/commondata")
public class CommonDataController {

    private final CommonDataService commonDataService;

    @GetMapping("/depts")
    @ResponseBody
    public List<CommonDept> getDetps(@RequestParam(required = false) String searchKeyCond,
                                        HttpSession session) {

        Login login = (Login) session.getAttribute("loginUser");

        return commonDataService.getDepts(searchKeyCond, login.getSysPlantCd());
    }

    @GetMapping("/users")
    @ResponseBody
    public List<CommonUsers> getUsers(@RequestParam(required = false) String searchKeyCond,
                                        @RequestParam(required = false) String deptCd,
                                        HttpSession session) {

        Login login = (Login) session.getAttribute("loginUser");

        return commonDataService.getUsers(searchKeyCond, deptCd, login.getSysPlantCd());
    }

    @GetMapping("/deptuser")
    @ResponseBody
    public List<CommonDeptUser> getDeptUsers(@RequestParam(required = false) String searchKeyCond,
                                                HttpSession session) {

        Login login = (Login) session.getAttribute("loginUser");

        return commonDataService.getDeptUsers(searchKeyCond, login.getSysPlantCd());
    }

    @GetMapping("/plants")
    @ResponseBody
    public List<CommonPlant> getPlants(@RequestParam(required = false) String searchKeyCond,
                                        HttpSession session) {

        Login login = (Login) session.getAttribute("loginUser");

        return commonDataService.getPlants(searchKeyCond, login.getSysPlantCd());
    }

    @GetMapping("/email")
    @ResponseBody
    public CommonEmail getEmail(@RequestParam String sysPlantCd) {

        return commonDataService.getEmail(sysPlantCd);
    }
}
