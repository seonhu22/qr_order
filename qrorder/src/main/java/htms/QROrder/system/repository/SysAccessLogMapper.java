package htms.QROrder.system.repository;

import htms.QROrder.system.domain.SysAccessLogDetail;
import htms.QROrder.system.domain.SysAccessLogMaster;
import org.apache.ibatis.annotations.Mapper;

import java.util.Date;
import java.util.List;

@Mapper
public interface SysAccessLogMapper {
    List<SysAccessLogMaster> getSysAccessLogMaster(String searchKeyword, Date startDate, Date endDate);
    List<SysAccessLogDetail> getSysAccessLogDetail(String sysId);
}
