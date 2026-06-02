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
