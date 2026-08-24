package htms.QROrder.consumer.menu.controller;

import htms.QROrder.common.dto.CommonResponse;
import htms.QROrder.consumer.menu.dto.ConsumerMenuDetailEnvelope;
import htms.QROrder.consumer.menu.dto.ConsumerMenuDetailResponse;
import htms.QROrder.consumer.menu.dto.ConsumerMenuMainEnvelope;
import htms.QROrder.consumer.menu.dto.ConsumerMenuMainResponse;
import htms.QROrder.consumer.menu.dto.ConsumerMenuSearchEnvelope;
import htms.QROrder.consumer.menu.dto.ConsumerMenuSearchResponse;
import htms.QROrder.consumer.menu.service.ConsumerMenuService;
import htms.QROrder.qr.dto.QrConnectResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/api/consumer/menu")
public class ConsumerMenuController {

    private final ConsumerMenuService consumerMenuService;

    @Operation(
            operationId = "getConsumerMenuMain",
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
    @ApiResponse(
            responseCode = "500",
            description = "메뉴 데이터 조회 실패",
            content = @Content(schema = @Schema(implementation = CommonResponse.class))
    )
    @GetMapping("/main")
    public ResponseEntity<CommonResponse> getMain(HttpSession session) {
        QrConnectResponse qrTableInfo = getValidQrTableInfo(session);

        if (qrTableInfo == null) {
            return unauthorizedQrSession(session);
        }

        ConsumerMenuMainResponse response;

        try {
            response = consumerMenuService.getMain(
                    qrTableInfo.getSysPlantCd(),
                    qrTableInfo.getTableNum()
            );
        } catch (DataAccessException exception) {
            return menuDataUnavailable("main", exception);
        }

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
            operationId = "searchConsumerMenu",
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
    @ApiResponse(
            responseCode = "400",
            description = "검색 조건이 허용 길이를 초과함",
            content = @Content(schema = @Schema(implementation = CommonResponse.class))
    )
    @ApiResponse(
            responseCode = "500",
            description = "메뉴 데이터 조회 실패",
            content = @Content(schema = @Schema(implementation = CommonResponse.class))
    )
    @GetMapping("/search")
    public ResponseEntity<CommonResponse> search(
            @Parameter(schema = @Schema(maxLength = 100))
            @RequestParam(name = "searchKeyword", required = false) String searchKeyword,
            @Parameter(schema = @Schema(maxLength = 64))
            @RequestParam(name = "categorySysId", required = false) String categorySysId,
            HttpSession session) {
        QrConnectResponse qrTableInfo = getValidQrTableInfo(session);

        if (qrTableInfo == null) {
            return unauthorizedQrSession(session);
        }

        ConsumerMenuSearchResponse response;

        try {
            response = consumerMenuService.search(
                    qrTableInfo.getSysPlantCd(),
                    searchKeyword,
                    categorySysId
            );
        } catch (DataAccessException exception) {
            return menuDataUnavailable("search", exception);
        }

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
            operationId = "getConsumerMenuDetail",
            summary = "Consumer 메뉴 상세 조회",
            description = "QR 세션의 사업장에 노출 가능한 메뉴 정보와 활성 옵션을 조회합니다."
    )
    @ApiResponse(
            responseCode = "200",
            description = "메뉴 상세 조회 성공",
            content = @Content(schema = @Schema(implementation = ConsumerMenuDetailEnvelope.class))
    )
    @ApiResponse(
            responseCode = "401",
            description = "QR 세션이 없거나 만료됨",
            content = @Content(schema = @Schema(implementation = CommonResponse.class))
    )
    @ApiResponse(
            responseCode = "404",
            description = "세션 사업장에서 조회할 수 없는 메뉴",
            content = @Content(schema = @Schema(implementation = CommonResponse.class))
    )
    @ApiResponse(
            responseCode = "500",
            description = "옵션 데이터 계약 오류",
            content = @Content(schema = @Schema(implementation = CommonResponse.class))
    )
    @ApiResponse(
            responseCode = "400",
            description = "메뉴 ID가 유효하지 않음",
            content = @Content(schema = @Schema(implementation = CommonResponse.class))
    )
    @GetMapping("/{menuSysId}")
    public ResponseEntity<CommonResponse> getDetail(
            @Parameter(schema = @Schema(maxLength = 64))
            @PathVariable("menuSysId") String menuSysId,
            HttpSession session) {
        QrConnectResponse qrTableInfo = getValidQrTableInfo(session);

        if (qrTableInfo == null) {
            return unauthorizedQrSession(session);
        }

        String sysPlantCd = qrTableInfo.getSysPlantCd();

        ConsumerMenuDetailResponse response;

        try {
            if (!consumerMenuService.isStoreAvailable(sysPlantCd)) {
                return unauthorizedQrSession(session);
            }

            response = consumerMenuService.getDetail(sysPlantCd, menuSysId);
        } catch (DataAccessException exception) {
            return menuDataUnavailable("detail", exception);
        } catch (IllegalStateException exception) {
            log.error("Invalid consumer menu option data. menuSysId={}", menuSysId, exception);
            return invalidMenuOptionData();
        }

        if (response == null) {
            return menuNotFound();
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

    private ResponseEntity<CommonResponse> menuNotFound() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                CommonResponse.builder()
                        .success(false)
                        .message("메뉴를 찾을 수 없습니다.")
                        .build()
        );
    }

    private ResponseEntity<CommonResponse> invalidMenuOptionData() {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                CommonResponse.builder()
                        .success(false)
                        .message("메뉴 옵션 정보를 불러올 수 없습니다. 관리자에게 문의해주세요.")
                        .build()
        );
    }

    private ResponseEntity<CommonResponse> menuDataUnavailable(
            String operation,
            DataAccessException exception) {
        log.error("Failed to load consumer menu data. operation={}", operation, exception);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                CommonResponse.builder()
                        .success(false)
                        .message("메뉴 정보를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.")
                        .build()
        );
    }
}
