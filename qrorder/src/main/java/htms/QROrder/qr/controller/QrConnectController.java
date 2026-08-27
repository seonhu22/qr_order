package htms.QROrder.qr.controller;

import htms.QROrder.common.dto.CommonResponse;
import htms.QROrder.qr.dto.QrConnectResponse;
import htms.QROrder.qr.service.QrConnectService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/qr")
public class QrConnectController {

    private final QrConnectService qrConnectService;

    @GetMapping("/{url}")
    public ResponseEntity<CommonResponse> getTableInfo(@PathVariable String url,
                                                        HttpSession session) {

        QrConnectResponse response = qrConnectService.getTableInfo(url);

        if (response == null) {
            // 재연결에 실패했는데 이전 QR 권한이 남으면 만료된 테이블로 계속 주문할 수 있다.
            // 직원 로그인(loginUser)은 같은 세션을 공유할 수 있으므로 건드리지 않는다.
            session.removeAttribute("qrTableInfo");

            return ResponseEntity.status(404).body(
                    CommonResponse.builder()
                            .success(false)
                            .message("유효하지 않은 QR코드입니다.")
                            .build()
            );
        }

        session.setAttribute("qrTableInfo", response);

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .data(response)
                        .build()
        );
    }
}
