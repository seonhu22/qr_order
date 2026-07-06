package htms.QROrder.client.repository;

import htms.QROrder.client.dto.PaymentInfoMasterResponse;
import org.apache.ibatis.annotations.Mapper;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface PaymentInfoMasterMapper {
    List<PaymentInfoMasterResponse> getPaymentInfoMaster(String paymentStatus, LocalDate startDate, LocalDate endDate, String sysPlantCd);
}