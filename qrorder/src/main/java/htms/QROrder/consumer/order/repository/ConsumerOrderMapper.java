package htms.QROrder.consumer.order.repository;

import htms.QROrder.consumer.order.repository.row.ConsumerOrderDetailHeaderRow;
import htms.QROrder.consumer.order.repository.row.ConsumerOrderItemRow;
import htms.QROrder.consumer.order.repository.row.ConsumerOrderOptionRow;
import htms.QROrder.consumer.order.repository.row.ConsumerOrderSummaryRow;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface ConsumerOrderMapper {
    int lockOrderNumberScope(String sysPlantCd);

    int findNextOrderNumber(String sysPlantCd);

    void insertOrderGroup(ConsumerOrderWriteRows.Group group);

    void insertOrderDetail(ConsumerOrderWriteRows.Item item);

    void insertOrderDetailOption(ConsumerOrderWriteRows.Option option);

    List<ConsumerOrderSummaryRow> findOrders(String consumerSessionId, String sysPlantCd);

    ConsumerOrderDetailHeaderRow findOrderDetailHeader(String consumerSessionId,
                                                       String sysPlantCd,
                                                       String orderId);

    List<ConsumerOrderItemRow> findOrderItems(String consumerSessionId,
                                              String sysPlantCd,
                                              String orderId);

    List<ConsumerOrderOptionRow> findOrderOptions(String consumerSessionId,
                                                  String sysPlantCd,
                                                  String orderId);
}
