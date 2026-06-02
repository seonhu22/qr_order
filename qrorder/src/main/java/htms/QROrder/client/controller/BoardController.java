package htms.QROrder.client.controller;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.client.dto.ClientNoticeResponse;
import htms.QROrder.client.dto.ClientQnaRequest;
import htms.QROrder.client.dto.ClientQnaResponse;
import htms.QROrder.client.service.ClinetNoticeService;
import htms.QROrder.client.service.ClientQnaService;
import htms.QROrder.common.dto.CommonResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/client/board")
public class BoardController {

    private final ClinetNoticeService noticeService;
    private final ClientQnaService qnaService;

    @GetMapping("/notice/search")
    public List<ClientNoticeResponse> getNotice(@RequestParam String searchKeyword) {

        return noticeService.getNotice(searchKeyword);
    }

    @GetMapping("/qna/search")
    public List<ClientQnaResponse> getQna(@RequestParam String searchKeyword,
                                          HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");

        return qnaService.getQna(searchKeyword, loginUser.getSysPlantCd());
    }

    @PostMapping("/qna/new")
    public ResponseEntity<CommonResponse> newQna(@RequestBody ClientQnaRequest qnaRequest,
                                                    HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");
        String menuCd = (String) session.getAttribute("menuCd");

    qnaService.newQna(qnaRequest, loginUser.getUserId(), loginUser.getSysPlantCd(), menuCd);

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("생성 완료.")
                        .build()
        );
    }

    @PostMapping("/qna/update")
    public ResponseEntity<CommonResponse> updateQna(@RequestBody ClientQnaRequest qnaRequest,
                                                    HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");
        String menuCd = (String) session.getAttribute("menuCd");

        qnaService.updateQna(qnaRequest, loginUser.getUserId(), loginUser.getSysPlantCd(), menuCd);

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("수정 완료.")
                        .build()
        );
    }

    @PostMapping("/qna/del")
    public ResponseEntity<CommonResponse> delQna(@RequestBody ClientQnaRequest qnaRequest,
                                                    HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");
        String menuCd = (String) session.getAttribute("menuCd");

        qnaService.delQna(qnaRequest, loginUser.getUserId(), loginUser.getSysPlantCd(), menuCd);

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("삭제 완료.")
                        .build()
        );
    }
}
