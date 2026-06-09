package htms.QROrder.client.controller;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.client.dto.*;
import htms.QROrder.client.service.*;
import htms.QROrder.common.dto.CommonResponse;
import htms.QROrder.common.dto.FileRequest;
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
    private final MenuOptionMasterService menuOptionMasterService;
    private final MenuOptionGroupService menuOptionGroupService;
    private final MenuOptionDetailService menuOptionDetailService;

    // 메뉴 관리
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
    public ResponseEntity<CommonResponse> saveMenuDetail(@ModelAttribute MenuDetailRequest menuDetailRequest,
                                                            @ModelAttribute FileRequest fileRequest,
                                                            HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");
        String menuCd = (String) session.getAttribute("menuCd");

        menuDetailService.saveMenuDetail(menuDetailRequest, fileRequest, loginUser.getUserId(), loginUser.getSysPlantCd(), menuCd);

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("저장 완료.")
                        .build()
        );
    }

    // 옵션관리
    @GetMapping("/option/master/search")
    public List<MenuOptionMasterResponse> getMenuOptionMaster(@RequestParam(required = false) String searchKeyword,
                                                                HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");

        return menuOptionMasterService.getMenuOptionMaster(searchKeyword, loginUser.getSysPlantCd());
    }

    @PostMapping("/option/master/new")
    public ResponseEntity<CommonResponse> newMenuOptionMaster(@RequestBody MenuOptionMasterRequest menuOptionMasterRequest,
                                                                HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");
        String menuCd = (String) session.getAttribute("menuCd");

        menuOptionMasterService.newMenuOptionMaster(menuOptionMasterRequest, loginUser.getUserId(), loginUser.getSysPlantCd(), menuCd);

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("생성 완료.")
                        .build()
        );
    }

    @PostMapping("/option/master/update")
    public ResponseEntity<CommonResponse> updateMenuOptionMaster(@RequestBody MenuOptionMasterRequest menuOptionMasterRequest,
                                                                    HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");
        String menuCd = (String) session.getAttribute("menuCd");

        menuOptionMasterService.updateMenuOptionMaster(menuOptionMasterRequest, loginUser.getUserId(), loginUser.getSysPlantCd(), menuCd);

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("수정 완료.")
                        .build()
        );
    }

    @PostMapping("/option/master/del")
    public ResponseEntity<CommonResponse> delMenuOptionMaster(@RequestBody List<MenuOptionMasterItem> menuOptionMasterItems,
                                                                HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");
        String menuCd = (String) session.getAttribute("menuCd");

        menuOptionMasterService.delMenuOptionMaster(menuOptionMasterItems, loginUser.getUserId(), loginUser.getSysPlantCd(), menuCd);

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("삭제 완료.")
                        .build()
        );
    }

    @GetMapping("/option/group/search/{masterSysId}")
    public List<MenuOptionGroupResponse> getMenuOptionGroup(@PathVariable("masterSysId") String masterSysId) {

        return menuOptionGroupService.getMenuOptionGroup(masterSysId);
    }

    @PostMapping("/option/group/new")
    public ResponseEntity<CommonResponse> newMenuOptionGroup(@RequestBody MenuOptionGroupRequest menuOptionGroupRequest,
                                                                HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");
        String menuCd = (String) session.getAttribute("menuCd");

        menuOptionGroupService.newMenuOptionGroup(menuOptionGroupRequest, loginUser.getUserId(), loginUser.getSysPlantCd(), menuCd);

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("생성 완료.")
                        .build()
        );
    }

    @PostMapping("/option/group/update")
    public ResponseEntity<CommonResponse> updateMenuOptionGroup(@RequestBody MenuOptionGroupRequest menuOptionGroupRequest,
                                                                    HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");
        String menuCd = (String) session.getAttribute("menuCd");

        menuOptionGroupService.updateMenuOptionGroup(menuOptionGroupRequest, loginUser.getUserId(), loginUser.getSysPlantCd(), menuCd);

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("수정 완료.")
                        .build()
        );
    }

    @PostMapping("/option/group/del")
    public ResponseEntity<CommonResponse> delMenuOptionGroup(@RequestBody List<MenuOptionGroupItem> menuOptionGroupItems,
                                                                HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");
        String menuCd = (String) session.getAttribute("menuCd");

        menuOptionGroupService.delMenuOptionGroup(menuOptionGroupItems, loginUser.getUserId(), loginUser.getSysPlantCd(), menuCd);

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("삭제 완료.")
                        .build()
        );
    }

    @GetMapping("/option/detail/search/{groupSysId}")
    public List<MenuOptionDetailResponse> getMenuOptionDetail(@PathVariable("groupSysId") String groupSysId) {

        return menuOptionDetailService.getMenuOptionDetail(groupSysId);
    }

    @PostMapping("/option/detail/save")
    public ResponseEntity<CommonResponse> saveMenuOptionDetail(@ModelAttribute MenuOptionDetailRequest menuOptionDetailRequest,
                                                                    @ModelAttribute FileRequest fileRequest,
                                                                    HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");
        String menuCd = (String) session.getAttribute("menuCd");

        menuOptionDetailService.saveMenuOptionDetail(menuOptionDetailRequest, fileRequest, loginUser.getUserId(), loginUser.getSysPlantCd(), menuCd);

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("저장 완료.")
                        .build()
        );
    }
}
