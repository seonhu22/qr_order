package htms.QROrder.system.repository;

import htms.QROrder.system.domain.AuditTrail;
import org.apache.ibatis.annotations.Mapper;

import java.util.Date;
import java.util.List;

@Mapper
public interface AuditTrailMapper {
    List<AuditTrail> getAuditTrail(String searchKeyword, Date startDate, Date endDate);
}
