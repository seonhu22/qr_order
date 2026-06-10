package htms.QROrder.system.repository;

import htms.QROrder.system.domain.AuditTrail;
import org.apache.ibatis.annotations.Mapper;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

@Mapper
public interface AuditTrailMapper {
    List<AuditTrail> getAuditTrail(String changeType, String searchKeyword, LocalDateTime startDate, LocalDateTime endDate);
}
