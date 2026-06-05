package htms.QROrder.system.service;

import htms.QROrder.system.domain.AuditTrail;
import htms.QROrder.system.repository.AuditTrailMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class AuditTrailService {

    private final AuditTrailMapper auditTrailMapper;

    public List<AuditTrail> getAuditTrail(String changeType,
                                            String searchKeyword,
                                            LocalDateTime startDate,
                                            LocalDateTime endDate) {

        return auditTrailMapper.getAuditTrail(changeType, searchKeyword, startDate, endDate);
    }
}
