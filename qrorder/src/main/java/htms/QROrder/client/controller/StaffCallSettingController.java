package htms.QROrder.client.controller;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.client.dto.StaffCallSettingItem;
import htms.QROrder.client.dto.StaffCallSettingRequest;
import htms.QROrder.client.service.StaffCallSettingService;
import htms.QROrder.common.dto.CommonResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/client/staff-call/settings")
public class StaffCallSettingController {
    private final StaffCallSettingService service;

    @GetMapping
    public List<StaffCallSettingItem> findAll(HttpSession session) {
        Login loginUser = (Login) session.getAttribute("loginUser");
        return service.findAll(loginUser.getSysPlantCd());
    }

    @PostMapping("/save")
    public ResponseEntity<CommonResponse> save(@RequestBody StaffCallSettingRequest request,
                                               HttpSession session) {
        Login loginUser = (Login) session.getAttribute("loginUser");
        service.save(request, loginUser.getSysPlantCd());
        return ResponseEntity.ok(CommonResponse.builder().success(true).message("저장 완료.").build());
    }
}
