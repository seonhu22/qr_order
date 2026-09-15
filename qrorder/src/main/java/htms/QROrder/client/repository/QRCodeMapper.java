package htms.QROrder.client.repository;

import htms.QROrder.client.dto.QRCodeResponse;
import htms.QROrder.client.dto.QRCodeItem;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface QRCodeMapper {
    List<QRCodeResponse> getQRCode(String sysPlantCd);
    void newQRCode(List<QRCodeItem> newItems, String userId, String sysPlantCd, String menuCd);
    void updateQRCode(List<QRCodeItem> updateItems, String userId, String sysPlantCd, String menuCd);
    void delQRCode(List<QRCodeItem> delItems, String userId, String sysPlantCd, String menuCd);
    List<QRCodeItem> getDuplicateData(List<QRCodeItem> qrCodeItem);
    List<QRCodeItem> getOldData(List<QRCodeItem> qrCodeItem);
    boolean duplicateChk(List<QRCodeItem> newItems);
}
