package htms.QROrder.system.controller;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.common.dto.CommonResponse;
import htms.QROrder.system.service.ClientUserRoleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
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
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "승격 완료, 이미 관리자, 또는 구독 01을 영구 01로 전환", content = @Content(schema = @Schema(implementation = CommonResponse.class))),
            @ApiResponse(responseCode = "401", description = "미인증", content = @Content(schema = @Schema(implementation = CommonResponse.class))),
            @ApiResponse(responseCode = "403", description = "권한 또는 대상 범위 위반", content = @Content(schema = @Schema(implementation = CommonResponse.class))),
            @ApiResponse(responseCode = "404", description = "대상 없음", content = @Content(schema = @Schema(implementation = CommonResponse.class))),
            @ApiResponse(responseCode = "409", description = "허용되지 않은 역할 전이", content = @Content(schema = @Schema(implementation = CommonResponse.class)))
    })
    @PostMapping("/{sysId}/promote")
    public ResponseEntity<CommonResponse> promoteClientUser(@PathVariable String sysId, HttpSession session) {
        var result = service.promote(sysId, (Login) session.getAttribute("loginUser"));
        String message = result == ClientUserRoleService.Promotion.MADE_PERMANENT
                ? "영구 권한으로 전환 완료." : "매장 관리자 승격 완료.";
        return ResponseEntity.ok(CommonResponse.builder().success(true).message(message).build());
    }
}
