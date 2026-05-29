package htms.QROrder.client.controller;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.client.dto.NoticeResponse;
import htms.QROrder.client.dto.QnaRequest;
import htms.QROrder.client.dto.QnaResponse;
import htms.QROrder.client.service.NoticeService;
import htms.QROrder.client.service.QnaService;
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

    private final NoticeService noticeService;
    private final QnaService qnaService;

    @GetMapping("/notice/search")
    public List<NoticeResponse> getNotice(@RequestParam String searchKeyword) {

        return noticeService.getNotice(searchKeyword);
    }

    @GetMapping("/qna/search")
    public List<QnaResponse> getQna(@RequestParam String searchKeyword,
                                        HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");

        return qnaService.getQna(searchKeyword, loginUser.getSysPlantCd());
    }

    @PostMapping("/qna/new")
    public ResponseEntity<CommonResponse> newQna(@RequestBody QnaRequest qnaRequest,
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
    public ResponseEntity<CommonResponse> updateQna(@RequestBody QnaRequest qnaRequest,
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
    public ResponseEntity<CommonResponse> delQna(@RequestBody QnaRequest qnaRequest,
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
