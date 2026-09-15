package htms.QROrder.client.repository;

import htms.QROrder.client.dto.*;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface MenuMasterMapper {
    List<MenuMasterResponse> getMenuMaster(String searchKeyword, String sysPlantCd);
    void newMenuMaster(MenuMasterRequest newItems, String userId, String sysPlantCd);
    void updateMenuMaster(MenuMasterRequest updateItems, String userId, String sysPlantCd);
    void delMenuMaster(List<MenuMasterItem> delItems, String userId, String sysPlantCd, String menuCd);
    MenuMasterResponse getOldData(String sysId);
    boolean duplicateChk(MenuMasterRequest menuMasterRequest);
}
