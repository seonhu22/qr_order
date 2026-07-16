package htms.QROrder.client.repository;

import htms.QROrder.client.dto.*;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface MenuDetailMapper {
    List<MenuDetailResponse> getMenuDetailSearchKeyword(String searchKeyword);
    List<MenuDetailResponse> getMenuDetail(String masterSysId);
    void newMenuDetail(List<MenuDetailItem> newItems, String userId, String sysPlantCd, String menuCd);
    void updateMenuDetail(List<MenuDetailItem> updateItems, String userId, String sysPlantCd, String menuCd);
    void delMenuDetail(List<MenuDetailItem> delItems, String userId, String sysPlantCd, String menuCd);
    List<MenuDetailItem> getDuplicateData(List<MenuDetailItem> menuDetailItem);
    List<MenuDetailItem> getOldData(List<MenuDetailItem> menuDetailItem);
    boolean duplicateChk(List<MenuDetailItem> newItems);
}
