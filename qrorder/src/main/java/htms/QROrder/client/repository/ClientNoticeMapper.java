package htms.QROrder.client.repository;

import htms.QROrder.client.dto.ClientNoticeResponse;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface ClientNoticeMapper {
    List<ClientNoticeResponse> getNotice(String searchKeyword);
}
