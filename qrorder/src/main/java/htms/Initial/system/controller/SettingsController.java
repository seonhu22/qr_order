package htms.Initial.system.controller;

import htms.Initial.auth.domain.Login;
import htms.Initial.common.dto.CommonResponse;
import htms.Initial.system.domain.*;
import htms.Initial.system.service.*;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@Controller
@ControllerAdvice
@RequiredArgsConstructor
@RequestMapping("/system/settings")
public class SettingsController {

    private final PlantService plantService;

    // 사업장관리 메
    @GetMapping("/plant")
    public String plant() {
        return "system/settings/plant/plant";
    }

    // 사업장관리 조회
    @GetMapping("/plant/search")
    @ResponseBody
    public List<Plant> searchPlant(@RequestParam(required = false) String searchKeyword) {
        return plantService.findPlantBySearchCond(searchKeyword);
    }

    // 사업장 추가
    @PostMapping("/plant/new")
    @ResponseBody
    public ResponseEntity<CommonResponse> newPlant(@RequestBody @Valid Plant plant,
                                                    HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");
        String menuCd = (String) session.getAttribute("menuCd");

        plantService.newPlant(plant, loginUser.getUserId(), loginUser.getSysPlantCd(), menuCd);

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("생성 완료.")
                        .build()
        );
    }

    // 사업장 수정
    @PostMapping("/plant/update")
    @ResponseBody
    public ResponseEntity<CommonResponse> updatePlant(@RequestBody @Valid Plant plant,
                                                        HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");
        String menuCd = (String) session.getAttribute("menuCd");

        plantService.updatePlant(plant, loginUser.getUserId(), loginUser.getSysPlantCd(), menuCd);

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("수정 완료.")
                        .build()
        );
    }

    // 사업장 삭제
    @PostMapping("/plant/del")
    @ResponseBody
    public ResponseEntity<CommonResponse> delPlant(@RequestBody List<Plant> plants,
                                                    HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");
        String menuCd = (String) session.getAttribute("menuCd");

        plantService.delPlantByCheckCond(plants, loginUser.getUserId(), loginUser.getSysPlantCd(), menuCd);

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("삭제 완료")
                        .build()
        );
    }
}
