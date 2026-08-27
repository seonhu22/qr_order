package htms.QROrder.consumer.order.repository;

import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ConsumerOrderMapper {
    int lockOrderNumberScope(String sysPlantCd);

    int findNextOrderNumber(String sysPlantCd);

    void insertOrderGroup(ConsumerOrderWriteRows.Group group);

    void insertOrderDetail(ConsumerOrderWriteRows.Item item);

    void insertOrderDetailOption(ConsumerOrderWriteRows.Option option);
}
