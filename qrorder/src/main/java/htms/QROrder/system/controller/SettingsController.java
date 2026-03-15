package htms.QROrder.system.controller;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.common.dto.CommonResponse;
import htms.QROrder.system.domain.*;
import htms.QROrder.system.domain.Menu;
import htms.QROrder.system.dto.AdminUserRequest;
import htms.QROrder.system.dto.AdminUserResponse;
import htms.QROrder.system.dto.CommonDetailRequest;
import htms.QROrder.system.dto.MessageRequest;
import htms.QROrder.system.service.*;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.awt.*;
import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/system/settings")
public class SettingsController {

    private final CommonMasterService commonMasterService;
    private final CommonDetailService commonDetailService;
    private final PlantService plantService;
    private final AdminUserService adminUserService;
    private final MenuService menuService;
    private final MessageService messageService;

    // 공통코드 조회
    @GetMapping("/common/search")
    public List<CommonMaster> searchCommon(@RequestParam(required = false) String searchKeyword) {

        return commonMasterService.findCommonBySearchCond(searchKeyword);
    }

    // 공통코드 상세목록 조회
    @GetMapping("/common/search/{linkSysId}")
    public List<CommonDetail> searchCommonDetail(@PathVariable("linkSysId") String masterSysId,
                                                    @RequestParam(required = false) String searchKeyword) {

        return commonDetailService.findCommonDetailBySearchCond(masterSysId, searchKeyword);
    }

    // 공통코드 마스터 추가
    @PostMapping("/common/master/new")
    public ResponseEntity<CommonResponse> newCommonMaster(@RequestBody @Valid CommonMaster commonMaster,
                                                                HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");
        String menuCd = (String) session.getAttribute("menuCd");

        commonMasterService.newCommonMaster(commonMaster, loginUser.getUserId(), loginUser.getSysPlantCd(), menuCd);

        return ResponseEntity.ok(
                CommonResponse.<Void>builder()
                        .success(true)
                        .message("생성 완료.")
                        .build()
        );
    }

    // 공통코드 마스터 삭제
    @PostMapping("/common/master/del")
    public ResponseEntity<CommonResponse> delCommonMaster(@RequestBody List<CommonMaster> commonMasters,
                                                                HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");
        String menuCd = (String) session.getAttribute("menuCd");

        commonMasterService.delCommonMasterByCheckCond(commonMasters, loginUser.getUserId(), loginUser.getSysPlantCd(), menuCd);

        return ResponseEntity.ok(
                CommonResponse.<Void>builder()
                        .success(true)
                        .message("삭제 완료.")
                        .build()
        );
    }

    // 공통코드 마스터 업데이트
    @PostMapping("/common/master/update")
    public ResponseEntity<CommonResponse> updateCommonMaster(@RequestBody @Valid CommonMaster commonMaster,
                                                                    HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");
        String menuCd = (String) session.getAttribute("menuCd");

        commonMasterService.updateCommonMaster(commonMaster, loginUser.getUserId(), loginUser.getSysPlantCd(), menuCd);

        return ResponseEntity.ok(
                CommonResponse.<Void>builder()
                        .success(true)
                        .message("수정 완료.")
                        .build()
        );
    }

    // 공통코드 상세 저장
    @PostMapping("/common/detail/save")
    public ResponseEntity<CommonResponse> saveCommonDetail(@RequestBody @Valid CommonDetailRequest requestData,
                                                                    HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");
        String menuCd = (String) session.getAttribute("menuCd");

        commonDetailService.saveCommonDetail(requestData, loginUser.getUserId(), loginUser.getSysPlantCd(), menuCd);

        return ResponseEntity.ok(
                CommonResponse.<Void>builder()
                        .success(true)
                        .message("저장 완료.")
                        .build()
        );
    }

    // 사업장 조회
    @GetMapping("/plant/search")
    public List<Plant> searchPlant(@RequestParam(required = false) String searchKeyword) {

        return plantService.findPlantBySearchCond(searchKeyword);
    }

    // 사업장 추가
    @PostMapping("/plant/new")
    public ResponseEntity<CommonResponse> newPlant(@RequestBody @Valid Plant plant,
                                                            HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");
        String menuCd = (String) session.getAttribute("menuCd");

        plantService.newPlant(plant, loginUser.getUserId(), loginUser.getSysPlantCd(), menuCd);

        return ResponseEntity.ok(
                CommonResponse.<Void>builder()
                        .success(true)
                        .message("생성 완료.")
                        .build()
        );
    }

    // 사업장 수정
    @PostMapping("/plant/update")
    public ResponseEntity<CommonResponse> updatePlant(@RequestBody @Valid Plant plant,
                                                            HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");
        String menuCd = (String) session.getAttribute("menuCd");

        plantService.updatePlant(plant, loginUser.getUserId(), loginUser.getSysPlantCd(), menuCd);

        return ResponseEntity.ok(
                CommonResponse.<Void>builder()
                        .success(true)
                        .message("수정 완료.")
                        .build()
        );
    }

    // 사업장 삭제
    @PostMapping("/plant/del")
    public ResponseEntity<CommonResponse> delPlant(@RequestBody List<Plant> plants,
                                                            HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");
        String menuCd = (String) session.getAttribute("menuCd");

        plantService.delPlantByCheckCond(plants, loginUser.getUserId(), loginUser.getSysPlantCd(), menuCd);

        return ResponseEntity.ok(
                CommonResponse.<Void>builder()
                        .success(true)
                        .message("삭제 완료.")
                        .build()
        );
    }

    @GetMapping("/adminuser/search")
    public List<AdminUserResponse> getAdminUser(@RequestParam(required = false) String searchKeyword) {

        return adminUserService.getAdminUser(searchKeyword);
    }

    @PostMapping("/adminuser/save")
    public ResponseEntity<CommonResponse> saveAdminUser(@RequestBody AdminUserRequest adminUserRequest,
                                                            HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");

        adminUserService.saveAdminUser(adminUserRequest, loginUser.getUserId(), loginUser.getSysPlantCd());

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("저장 완료.")
                        .build()
        );
    }

    @GetMapping("/menu/search")
    public List<Menu> getMenu() {

        return menuService.getMenu();
    }

    @PostMapping("/menu/save")
    public ResponseEntity<CommonResponse> saveMenu(List<Menu> menu,
                                                    HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");

        menuService.saveMenu(menu, loginUser.getUserId(), loginUser.getSysPlantCd());

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("저장 완료.")
                        .build()
        );
    }

    @GetMapping("/message/search")
    public List<Message> getMessage(@RequestParam(required = false) String searchKeyword) {

        return messageService.getMessage(searchKeyword);
    }

    @PostMapping("/message/save")
    public ResponseEntity<CommonResponse> saveMessage(@RequestBody MessageRequest messageRequest,
                                                        HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");

        messageService.saveMessage(messageRequest, loginUser.getUserId(), loginUser.getSysPlantCd());

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("저장 완료.")
                        .build()
        );
    }
}
