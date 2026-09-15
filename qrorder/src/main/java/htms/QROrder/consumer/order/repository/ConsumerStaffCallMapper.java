package htms.QROrder.consumer.order.repository;

import htms.QROrder.consumer.order.dto.ConsumerStaffCallRequest;
import htms.QROrder.consumer.order.dto.ConsumerStaffCallResponse;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface ConsumerStaffCallMapper {
    List<ConsumerStaffCallResponse> getConsumerStaffCall(String sysPlantCd);
    void saveConsumerStaffCall(ConsumerStaffCallRequest consumerStaffCall, String sysPlantCd);
}
