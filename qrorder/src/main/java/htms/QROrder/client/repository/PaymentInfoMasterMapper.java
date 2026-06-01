package htms.QROrder.client.repository;

import htms.QROrder.client.dto.PaymentCompleteResponse;
import htms.QROrder.client.dto.PaymentInfoMasterResponse;
import htms.QROrder.client.dto.StatusCancelResponse;
import htms.QROrder.client.dto.StatusItem;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface PaymentInfoMasterMapper {
    List<PaymentInfoMasterResponse> getPaymentInfoMaster(String paymentStatus, String sysPlantCd);
}