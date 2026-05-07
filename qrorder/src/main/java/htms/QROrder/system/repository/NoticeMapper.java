package htms.QROrder.system.repository;

import htms.QROrder.system.domain.Notice;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface NoticeMapper {
    Notice getOldData(@Param("sysId") String sysId);
}
