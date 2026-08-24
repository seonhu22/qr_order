package htms.QROrder.consumer.menu.controller;

import htms.QROrder.common.dto.CommonResponse;
import htms.QROrder.consumer.menu.dto.ConsumerMenuMainEnvelope;
import htms.QROrder.consumer.menu.dto.ConsumerMenuMainResponse;
import htms.QROrder.consumer.menu.dto.ConsumerMenuSearchEnvelope;
import htms.QROrder.consumer.menu.dto.ConsumerMenuSearchResponse;
import htms.QROrder.consumer.menu.service.ConsumerMenuService;
import htms.QROrder.qr.dto.QrConnectResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/consumer/menu")
public class ConsumerMenuController {

    private final ConsumerMenuService consumerMenuService;

    @Operation(
            summary = "Consumer 메뉴 메인 최초 조회",
            description = "호출 전에 GET /api/qr/{url}로 qrTableInfo 세션을 먼저 설정해야 합니다."
    )
    @ApiResponse(
            responseCode = "200",
            description = "메뉴 메인 조회 성공",
            content = @Content(schema = @Schema(implementation = ConsumerMenuMainEnvelope.class))
    )
    @ApiResponse(
            responseCode = "401",
            description = "QR 세션이 없거나 만료됨",
            content = @Content(schema = @Schema(implementation = CommonResponse.class))
    )
    @GetMapping("/main")
    public ResponseEntity<CommonResponse> getMain(HttpSession session) {
        QrConnectResponse qrTableInfo = getValidQrTableInfo(session);

        if (qrTableInfo == null) {
            return unauthorizedQrSession(session);
        }

        ConsumerMenuMainResponse response = consumerMenuService.getMain(
                qrTableInfo.getSysPlantCd(),
                qrTableInfo.getTableNum()
        );

        if (response == null) {
            return unauthorizedQrSession(session);
        }

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .data(response)
                        .build()
        );
    }

    @Operation(
            summary = "Consumer 메뉴 검색 및 카테고리 필터",
            description = "qrTableInfo 세션의 사업장에 노출 가능한 메뉴를 검색합니다."
    )
    @ApiResponse(
            responseCode = "200",
            description = "메뉴 검색 성공",
            content = @Content(schema = @Schema(implementation = ConsumerMenuSearchEnvelope.class))
    )
    @ApiResponse(
            responseCode = "401",
            description = "QR 세션이 없거나 만료됨",
            content = @Content(schema = @Schema(implementation = CommonResponse.class))
    )
    @GetMapping("/search")
    public ResponseEntity<CommonResponse> search(
            @RequestParam(name = "searchKeyword", required = false) String searchKeyword,
            @RequestParam(name = "categorySysId", required = false) String categorySysId,
            HttpSession session) {
        QrConnectResponse qrTableInfo = getValidQrTableInfo(session);

        if (qrTableInfo == null) {
            return unauthorizedQrSession(session);
        }

        ConsumerMenuSearchResponse response = consumerMenuService.search(
                qrTableInfo.getSysPlantCd(),
                searchKeyword,
                categorySysId
        );

        if (response == null) {
            return unauthorizedQrSession(session);
        }

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .data(response)
                        .build()
        );
    }

    private QrConnectResponse getValidQrTableInfo(HttpSession session) {
        Object sessionValue = session.getAttribute("qrTableInfo");

        if (!(sessionValue instanceof QrConnectResponse qrTableInfo)
                || qrTableInfo.getSysPlantCd() == null
                || qrTableInfo.getSysPlantCd().isBlank()
                || qrTableInfo.getTableNum() == null) {
            return null;
        }

        return qrTableInfo;
    }

    private ResponseEntity<CommonResponse> unauthorizedQrSession(HttpSession session) {
        session.removeAttribute("qrTableInfo");

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                CommonResponse.builder()
                        .success(false)
                        .message("QR 세션이 만료되었습니다. QR코드를 다시 스캔해주세요.")
                        .build()
        );
    }
}
