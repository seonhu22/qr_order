package htms.QROrder.client.repository;

import htms.QROrder.client.dto.StaffCallNotificationItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface StaffCallNotificationMapper {
    List<StaffCallNotificationItem> findUnread(@Param("sysPlantCd") String sysPlantCd);
    int markAllRead(@Param("sysPlantCd") String sysPlantCd);
}
