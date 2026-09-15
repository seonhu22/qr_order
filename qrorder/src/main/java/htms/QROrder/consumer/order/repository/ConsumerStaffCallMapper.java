package htms.QROrder.consumer.order.repository;

import htms.QROrder.consumer.order.dto.ConsumerStaffCallResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ConsumerStaffCallMapper {
    List<ConsumerStaffCallResponse> getConsumerStaffCall(String sysPlantCd);
    void saveConsumerStaffCall(
            @Param("sysId") String sysId,
            @Param("callCd") String callCd,
            @Param("description") String description,
            @Param("sysPlantCd") String sysPlantCd);
}
