package htms.QROrder.common.controller;

import htms.QROrder.common.dto.CommonResponse;
import htms.QROrder.common.dto.EmailRequest;
import htms.QROrder.common.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/email")
public class EmailController {

    private final EmailService emailService;

    @PostMapping("/send")
    public ResponseEntity<CommonResponse> sendEmail(@RequestBody EmailRequest emailRequest){

        emailService.sendEmail(emailRequest);

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("메일 전송 완료.")
                        .build()
        );
    }
}
