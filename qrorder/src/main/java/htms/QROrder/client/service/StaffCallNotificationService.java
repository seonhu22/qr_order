package htms.QROrder.client.service;

import htms.QROrder.client.dto.StaffCallNotificationItem;
import htms.QROrder.client.repository.StaffCallNotificationMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StaffCallNotificationService {
    private final StaffCallNotificationMapper mapper;

    @Transactional(readOnly = true)
    public List<StaffCallNotificationItem> findUnread(String sysPlantCd) {
        return mapper.findUnread(sysPlantCd);
    }

    @Transactional
    public void markAllRead(String sysPlantCd) {
        mapper.markAllRead(sysPlantCd);
    }
}
