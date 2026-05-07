package htms.QROrder.system.repository;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.Map;

@Mapper
public interface NoticeMapper {
    Map<String, Object> getOldData(@Param("sysId") String sysId);
}
