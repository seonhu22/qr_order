package htms.QROrder.client.service;

import htms.QROrder.client.dto.NoticeResponse;
import htms.QROrder.client.repository.NoticeMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class NoticeService {

    private final NoticeMapper noticeMapper;

    public List<NoticeResponse> getNotice(String searchKeyword) {

        return noticeMapper.getNotice(searchKeyword);
    }
}
