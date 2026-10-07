package htms.QROrder.client.controller;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.client.dto.StaffCallNotificationGroup;
import htms.QROrder.client.service.StaffCallNotificationService;
import htms.QROrder.common.dto.CommonResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/client/staff-call/notifications")
public class StaffCallNotificationController {
    private final StaffCallNotificationService service;

    @GetMapping("/unread")
    public List<StaffCallNotificationGroup> findUnread(HttpSession session) {
        Login loginUser = (Login) session.getAttribute("loginUser");
        return service.findUnread(loginUser.getSysPlantCd());
    }

    @PostMapping("/read-all")
    public ResponseEntity<CommonResponse> markAllRead(HttpSession session) {
        Login loginUser = (Login) session.getAttribute("loginUser");
        service.markAllRead(loginUser.getSysPlantCd());
        return ResponseEntity.ok(CommonResponse.builder().success(true).message("확인 완료.").build());
    }

    @PostMapping("/{masterSysId}/read")
    public ResponseEntity<CommonResponse> markRead(@PathVariable String masterSysId,
                                                   HttpSession session) {
        Login loginUser = (Login) session.getAttribute("loginUser");
        service.markRead(masterSysId, loginUser.getSysPlantCd());
        return ResponseEntity.ok(CommonResponse.builder().success(true).message("확인 완료.").build());
    }
}
