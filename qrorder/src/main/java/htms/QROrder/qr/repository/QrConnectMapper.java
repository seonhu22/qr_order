package htms.QROrder.qr.repository;

import htms.QROrder.qr.dto.QrConnectResponse;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface QrConnectMapper {
    QrConnectResponse getTableInfoByUrl(String url);
}