package htms.QROrder.client.repository;

import htms.QROrder.client.dto.MenuOptionDetailItem;
import htms.QROrder.client.dto.MenuOptionDetailResponse;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface MenuOptionDetailMapper {
    List<MenuOptionDetailResponse> getMenuOptionDetail(String masterSysId);
    void newMenuOptionDetail(List<MenuOptionDetailItem> newItems, String userId, String sysPlantCd, String menuCd);
    void updateMenuOptionDetail(List<MenuOptionDetailItem> updateItems, String userId, String sysPlantCd, String menuCd);
    void delMenuOptionDetail(List<MenuOptionDetailItem> delItems, String userId, String sysPlantCd, String menuCd);
    List<MenuOptionDetailItem> getDuplicateData(List<MenuOptionDetailItem> menuOptionDetailItems);
    List<MenuOptionDetailItem> getOldData(List<MenuOptionDetailItem> menuOptionDetailItems);
    boolean duplicateChk(List<MenuOptionDetailItem> newItems);
}
