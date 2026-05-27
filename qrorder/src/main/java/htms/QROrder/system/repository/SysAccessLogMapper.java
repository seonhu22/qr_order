package htms.QROrder.system.repository;

import htms.QROrder.system.domain.SysAccessLogDetail;
import htms.QROrder.system.domain.SysAccessLogMaster;
import org.apache.ibatis.annotations.Mapper;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

@Mapper
public interface SysAccessLogMapper {
    List<SysAccessLogMaster> getSysAccessLogMaster(String searchKeyword, LocalDateTime startDate, LocalDateTime endDate);
    List<SysAccessLogDetail> getSysAccessLogDetail(String sysId);
}
