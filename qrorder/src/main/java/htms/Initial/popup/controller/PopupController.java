package htms.Initial.popup.controller;

import htms.Initial.auth.domain.Login;
import htms.Initial.auth.dto.ChangePwdRequest;
import htms.Initial.common.dto.CommonResponse;
import htms.Initial.popup.dto.PopupPasswordRole;
import htms.Initial.popup.service.PopupPasswordRoleService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Slf4j
@Controller
@ControllerAdvice
@RequiredArgsConstructor
@RequestMapping("/popup/")
public class PopupController {
    private final PopupPasswordRoleService popupPasswordRoleService;

    @GetMapping("/change_password")
    @ResponseBody
    public PopupPasswordRole getPasswordRole(HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");

        return popupPasswordRoleService.getPasswordRole(loginUser.getSysPlantCd());
    }

    @PostMapping("/change_password/change")
    public ResponseEntity<CommonResponse> changePassword(@RequestBody ChangePwdRequest changePwdRequest,
                                                            HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");

        popupPasswordRoleService.changePassword(changePwdRequest, loginUser.getSysPlantCd());

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("비밀번호 변경 완료.")
                        .build()
        );
    }
}
