package htms.QROrder.client.repository;

import htms.QROrder.client.dto.*;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface StoreInfoMapper {
    List<StoreInfoResponse> getStoreInfo(String searchKeyword, String userId, String sysPlantCd);
    void updateStoreInfo(StoreInfoRequest updateItems, String userId, String sysPlantCd );
    StoreInfoResponse getOldData(String sysId);
    void updateEmail(StoreInfoRequest updateItems, String userId, String sysPlantCd);
}
