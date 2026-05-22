package htms.QROrder.client.controller;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.client.dto.ClientUserRequest;
import htms.QROrder.client.dto.ClientUserResponse;
import htms.QROrder.client.service.ClientUserService;
import htms.QROrder.common.dto.CommonResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/client/store_manage")
public class StoreManageController {

    private final ClientUserService clientUserService;

    @GetMapping("/user_manage/search")
    public List<ClientUserResponse> getClientUser(@RequestParam(required = false) String searchKeyword) {

        return clientUserService.getClientUser(searchKeyword);
    }

    @GetMapping("/user_manage/new")
    public ResponseEntity<CommonResponse> newClientUser(@RequestParam ClientUserRequest clientUserRequest,
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

    @GetMapping("/user_manage/update")
    public ResponseEntity<CommonResponse> updateClientUser(@RequestParam ClientUserRequest clientUserRequest,
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

    @GetMapping("/user_manage/del")
    public ResponseEntity<CommonResponse> delClientUser(@RequestParam ClientUserRequest clientUserRequest,
                                                            HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");
        String menuCd = (String) session.getAttribute("menuCd");

        clientUserService.delClientUser(clientUserRequest, loginUser.getUserId(), loginUser.getSysPlantCd(), menuCd);

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("삭제 완료.")
                        .build()
        );
    }
}
