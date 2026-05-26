package htms.QROrder.client.controller;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.client.dto.*;
import htms.QROrder.client.repository.StoreInfoMapper;
import htms.QROrder.client.service.ClientUserService;
import htms.QROrder.client.service.StoreInfoService;
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
@RequestMapping("/api/client/store_manage")
public class StoreManageController {

    private final ClientUserService clientUserService;
    private final StoreInfoService storeInfoService;

    @GetMapping("/user_manage/search")
    public List<ClientUserResponse> getClientUser(@RequestParam(required = false) String searchKeyword,
                                                    HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");

        return clientUserService.getClientUser(searchKeyword, loginUser.getSysPlantCd());
    }

    @PostMapping("/user_manage/new")
    public ResponseEntity<CommonResponse> newClientUser(@RequestBody ClientUserRequest clientUserRequest,
                                                            HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");
        String menuCd = (String) session.getAttribute("menuCd");

        clientUserService.newClientUser(clientUserRequest, loginUser.getUserId(), loginUser.getSysPlantCd(), menuCd);

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("생성 완료.")
                        .build()
        );
     }

    @PostMapping("/user_manage/update")
    public ResponseEntity<CommonResponse> updateClientUser(@RequestBody ClientUserRequest clientUserRequest,
                                                                HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");
        String menuCd = (String) session.getAttribute("menuCd");

        clientUserService.updateClientUser(clientUserRequest,  loginUser.getUserId(), loginUser.getSysPlantCd(), menuCd);

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("수정 완료.")
                        .build()
        );
    }

    @PostMapping("/user_manage/del")
    public ResponseEntity<CommonResponse> delClientUser(@RequestBody List<ClientUserItem> clientUserListRequest,
                                                            HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");
        String menuCd = (String) session.getAttribute("menuCd");

        clientUserService.delClientUser(clientUserListRequest, loginUser.getUserId(), loginUser.getSysPlantCd(), menuCd);

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("삭제 완료.")
                        .build()
        );
    }

    @GetMapping("/store_info/search")
    public List<StoreInfoResponse> getStoreInfo(@RequestParam(required = false) String searchKeyword,
                                                    HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");

        return storeInfoService.getStoreInfo(searchKeyword, loginUser.getSysPlantCd());
    }

    @PostMapping("/store_info/new")
    public ResponseEntity<CommonResponse> newStoreInfo(@RequestBody StoreInfoRequest storeInfoRequest,
                                                        HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");
        String menuCd = (String) session.getAttribute("menuCd");

        storeInfoService.newStoreInfo(storeInfoRequest, loginUser.getUserId(), loginUser.getSysPlantCd(), menuCd);

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("생성 완료.")
                        .build()
        );
    }

    @PostMapping("/store_info/update")
    public ResponseEntity<CommonResponse> updateStoreInfo(@RequestBody StoreInfoRequest storeInfoRequest,
                                                            HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");
        String menuCd = (String) session.getAttribute("menuCd");

        storeInfoService.updateStoreInfo(storeInfoRequest, loginUser.getUserId(), loginUser.getSysPlantCd(), menuCd);

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("수정 완료.")
                        .build()
        );
    }

    @PostMapping("/store_info/del")
    public ResponseEntity<CommonResponse> delStoreInfo(@RequestBody List<StoreInfoItem> storeInfoItems,
                                                            HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");
        String menuCd = (String) session.getAttribute("menuCd");

        storeInfoService.deleteStoreInfo(storeInfoItems, loginUser.getUserId(), loginUser.getSysPlantCd(), menuCd);

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("삭제 완료.")
                        .build()
        );
    }
}
