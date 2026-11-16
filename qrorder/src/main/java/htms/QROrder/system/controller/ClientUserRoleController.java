package htms.QROrder.system.controller;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.common.dto.CommonResponse;
import htms.QROrder.system.service.ClientUserRoleService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/system/client-users")
public class ClientUserRoleController {
    private final ClientUserRoleService service;

    @Operation(operationId = "promoteClientUser", summary = "시스템 관리자 전용 매장 관리자 승격")
    @PostMapping("/{sysId}/promote")
    public ResponseEntity<CommonResponse> promoteClientUser(@PathVariable String sysId, HttpSession session) {
        service.promote(sysId, (Login) session.getAttribute("loginUser"));
        return ResponseEntity.ok(CommonResponse.builder().success(true).message("매장 관리자 승격 완료.").build());
    }
}
