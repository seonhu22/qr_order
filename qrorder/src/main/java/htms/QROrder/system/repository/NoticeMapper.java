package htms.QROrder.system.repository;

import org.apache.ibatis.annotations.Mapper;

import java.util.Map;

@Mapper
public interface NoticeMapper {
    Map<String, Object> getOldData(String sysId);
}
