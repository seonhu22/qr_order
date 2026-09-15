package htms.QROrder.qr.service;

import htms.QROrder.qr.dto.QrConnectResponse;
import htms.QROrder.qr.repository.QrConnectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class QrConnectService {

    private final QrConnectMapper qrConnectMapper;

    public QrConnectResponse getTableInfo(String url) {

        return qrConnectMapper.getTableInfoByUrl(url);
    }
}