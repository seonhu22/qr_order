package htms.QROrder.client.repository;

import htms.QROrder.client.dto.*;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface StoreInfoMapper {
    List<StoreInfoResponse> getStoreInfo(String searchKeyword, String sysPlantCd);
    void newStoreInfo(StoreInfoRequest newItems, String userId, String sysPlantCd, String menuCd);
    void updateStoreInfo(StoreInfoRequest updateItems, String userId, String sysPlantCd, String menuCd);
    void delStoreInfo(List<StoreInfoItem> delItems, String userId, String sysPlantCd, String menuCd);
    StoreInfoResponse getOldData(String sysId);
    boolean duplicateChk(StoreInfoRequest storeInfoRequest);
}
