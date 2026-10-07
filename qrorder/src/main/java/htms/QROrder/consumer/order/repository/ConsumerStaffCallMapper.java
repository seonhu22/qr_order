package htms.QROrder.consumer.order.repository;

import htms.QROrder.consumer.order.dto.ConsumerStaffCallResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ConsumerStaffCallMapper {
    List<ConsumerStaffCallResponse> getConsumerStaffCall(String sysPlantCd);

    void insertStaffCallMaster(
            @Param("sysId") String sysId,
            @Param("sysPlantCd") String sysPlantCd,
            @Param("tableSysId") String tableSysId,
            @Param("tableNum") Integer tableNum,
            @Param("consumerSessionId") String consumerSessionId);

    void insertStaffCallItem(
            @Param("sysId") String sysId,
            @Param("linkSysId") String linkSysId,
            @Param("callCd") String callCd,
            @Param("description") String description,
            @Param("quantity") int quantity);
}
