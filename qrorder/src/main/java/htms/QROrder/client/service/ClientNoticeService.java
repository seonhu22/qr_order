package htms.QROrder.client.service;

import htms.QROrder.client.dto.ClientNoticeResponse;
import htms.QROrder.client.repository.ClientNoticeMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import htms.QROrder.auth.domain.Login;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class ClientNoticeService {

    private final ClientNoticeMapper noticeMapper;

    public List<ClientNoticeResponse> getNotice(String searchKeyword, Login actor) {
        if (actor == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        if (actor.getSysPlantCd() == null || actor.getSysPlantCd().isBlank() || "ADMIN".equals(actor.getSysPlantCd())
                || !("01".equals(actor.getUserRole()) || "02".equals(actor.getUserRole()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "매장 사용자만 공지를 조회할 수 있습니다.");
        }
        return noticeMapper.getNotice(searchKeyword, "01".equals(actor.getUserRole()) ? "manager" : "staff");
    }
}
