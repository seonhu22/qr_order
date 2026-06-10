package htms.QROrder.client.repository;

import htms.QROrder.client.dto.*;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface OrderHistoryMapper {
    List<OrderMasterHistoryItem> getOrderMasterHistory(String orderStatus, LocalDate startDate, LocalDate endDate);
    List<OrderTotalPriceItem> getOrderMasterTotalPrice(List<String> sysId);
    List<OrderDetailHistoryItem> getOrderDetailHistory(List<String> masterSysIds);
    List<OrderTotalPriceItem> getOrderDetailTotalPrice(List<String> sysId);
    List<OrderDetailOptionItem> getOrderDetailOption(List<String> sysId);
}
