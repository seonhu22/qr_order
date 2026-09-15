package htms.QROrder.audit.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.audit.domain.Audit;
import htms.QROrder.audit.domain.TableInfo;
import htms.QROrder.audit.dto.EmailLog;
import htms.QROrder.audit.repository.AuditMapper;
import htms.QROrder.audit.repository.EmailLogMapper;
import htms.QROrder.common.exception.ValidationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class EmailLogService {

    private final EmailLogMapper emailLogMapper;

    public void emailSendLog(EmailLog emailLog,
                                String userId,
                                String sysPlantCd) {

        emailLog.setSysId(UlidCreator.getUlid().toString());
        emailLogMapper.sendEmailLog(emailLog, userId, sysPlantCd);
    }
}
