package htms.QROrder.client.repository;

import htms.QROrder.client.dto.PaymentInfoDetailResponse;
import htms.QROrder.client.dto.PaymentInfoMasterResponse;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface PaymentInfoDetailMapper {
    List<PaymentInfoDetailResponse> getPaymentInfoDetail(String masterSysId);
}