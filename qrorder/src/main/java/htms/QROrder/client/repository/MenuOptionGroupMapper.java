package htms.QROrder.client.repository;

import htms.QROrder.client.dto.MenuOptionGroupResponse;
import htms.QROrder.client.dto.MenuOptionGroupItem;
import htms.QROrder.client.dto.MenuOptionGroupRequest;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface MenuOptionGroupMapper {
    List<MenuOptionGroupResponse> getMenuOptionGroup(String masterSysId);
    void newMenuOptionGroup(MenuOptionGroupRequest newItems, String userId, String sysPlantCd);
    void updateMenuOptionGroup(MenuOptionGroupRequest updateItems, String userId, String sysPlantCd);
    void delMenuOptionGroup(List<MenuOptionGroupItem> delItems, String userId, String sysPlantCd, String menuCd);
    MenuOptionGroupResponse getOldData(String sysId);
    boolean duplicateChk(MenuOptionGroupRequest menuOptionGroupRequest);
}
