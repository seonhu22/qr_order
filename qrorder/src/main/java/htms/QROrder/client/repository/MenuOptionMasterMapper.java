package htms.QROrder.client.repository;

import htms.QROrder.client.dto.*;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface MenuOptionMasterMapper {
    List<MenuOptionMasterResponse> getMenuOptionMaster(String searchKeyword, String sysPlantCd);
    void newMenuOptionMaster(MenuOptionMasterRequest newItems, String userId, String sysPlantCd);
    void updateMenuOptionMaster(MenuOptionMasterRequest updateItems, String userId, String sysPlantCd);
    void delMenuOptionMaster(List<MenuOptionMasterItem> delItems, String userId, String sysPlantCd, String menuCd);
    MenuOptionMasterResponse getOldData(String sysId);
    boolean duplicateChk(MenuOptionMasterRequest menuOptionMasterRequest);
}
