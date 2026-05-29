package htms.QROrder.client.repository;

import htms.QROrder.client.dto.NoticeResponse;
import htms.QROrder.client.dto.SettlementItem;
import htms.QROrder.client.dto.SettlementRequest;
import htms.QROrder.client.dto.SettlementResponse;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface NoticeMapper {
    List<NoticeResponse> getNotice(String searchKeyword);
}
