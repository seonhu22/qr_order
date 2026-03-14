package htms.QROrder.popup.controller;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.auth.dto.ChangePwdRequest;
import htms.QROrder.common.dto.CommonResponse;
import htms.QROrder.popup.service.PopupPasswordRoleService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/popup")
public class PopupController {
    private final PopupPasswordRoleService popupPasswordRoleService;

    @PostMapping("/change_password/change")
    public ResponseEntity<CommonResponse> changePassword(@RequestBody ChangePwdRequest changePwdRequest,
                                                                HttpSession session) {
        Login loginUser = (Login) session.getAttribute("loginUser");
        popupPasswordRoleService.changePassword(changePwdRequest, loginUser.getSysPlantCd());
        return ResponseEntity.ok(
                CommonResponse.<Void>builder()
                        .success(true)
                        .message("비밀번호 변경 완료.")
                        .build()
        );
    }
}
