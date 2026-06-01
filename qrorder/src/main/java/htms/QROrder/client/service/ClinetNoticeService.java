package htms.QROrder.client.service;

import htms.QROrder.client.dto.ClientNoticeResponse;
import htms.QROrder.client.repository.ClientNoticeMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class ClinetNoticeService {

    private final ClientNoticeMapper noticeMapper;

    public List<ClientNoticeResponse> getNotice(String searchKeyword) {

        return noticeMapper.getNotice(searchKeyword);
    }
}
