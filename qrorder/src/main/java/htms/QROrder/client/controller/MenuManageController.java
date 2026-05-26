package htms.QROrder.client.controller;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.client.dto.*;
import htms.QROrder.client.service.MenuDetailService;
import htms.QROrder.client.service.MenuMasterService;
import htms.QROrder.common.dto.CommonResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/client/menu_manage")
public class MenuManageController {

    private final MenuMasterService menuMasterService;
    private final MenuDetailService menuDetailService;

    @GetMapping("/menu/master/search")
    public List<MenuMasterResponse> getMenuMaster(@RequestParam(required = false) String searchKeyword,
                                                  HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");

        return menuMasterService.getMenuMaster(searchKeyword, loginUser.getSysPlantCd());
    }

    @PostMapping("/menu/master/new")
    public ResponseEntity<CommonResponse> newMenuMaster(@RequestBody MenuMasterRequest menuMasterRequest,
                                                            HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");
        String menuCd = (String) session.getAttribute("menuCd");

        menuMasterService.newMenuMaster(menuMasterRequest, loginUser.getUserId(), loginUser.getSysPlantCd(), menuCd);

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("생성 완료.")
                        .build()
        );
    }

    @PostMapping("/menu/master/update")
    public ResponseEntity<CommonResponse> updateMenuMaster(@RequestBody MenuMasterRequest menuMasterRequest,
                                                                HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");
        String menuCd = (String) session.getAttribute("menuCd");

        menuMasterService.updateMenuMaster(menuMasterRequest, loginUser.getUserId(), loginUser.getSysPlantCd(), menuCd);

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("수정 완료.")
                        .build()
        );
    }

    @PostMapping("/menu/master/del")
    public ResponseEntity<CommonResponse> delMenuMaster(@RequestBody List<MenuMasterItem> menuMasterItems,
                                                            HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");
        String menuCd = (String) session.getAttribute("menuCd");

        menuMasterService.delMenuMaster(menuMasterItems, loginUser.getUserId(), loginUser.getSysPlantCd(), menuCd);

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("삭제 완료.")
                        .build()
        );
    }

    @GetMapping("/menu/detail/search/{masterSysId}")
    public List<MenuDetailResponse> getMenuDetail(@PathVariable("masterSysId") String masterSysId) {

        return menuDetailService.getMenuDetail(masterSysId);
    }

    @PostMapping("/menu/detail/save")
    public ResponseEntity<CommonResponse> saveMenuDetail(@RequestBody MenuDetailRequest menuDetailRequest,
                                                            HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");
        String menuCd = (String) session.getAttribute("menuCd");

        menuDetailService.saveMenuDetail(menuDetailRequest, loginUser.getUserId(), loginUser.getSysPlantCd(), menuCd);

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("저장 완료.")
                        .build()
        );
    }
}
