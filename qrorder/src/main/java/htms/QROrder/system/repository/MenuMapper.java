package htms.QROrder.system.repository;

import htms.QROrder.system.domain.AdminUser;
import htms.QROrder.system.domain.Menu;
import htms.QROrder.system.dto.MenuRequest;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface MenuMapper {
    List<Menu> getMenu();
    void newMenu(List<Menu> newItems, String userId, String sysPlantCd);
    void updateMenu(List<Menu> updateItems, String userId, String sysPlantCd);
    void delMenu(List<String> ids, String userId, String sysPlantCd);
    boolean duplicateChk(List<Menu> menu);
    List<Menu> getDuplicateData(List<Menu> menu);
    List<Menu> getOldData(List<Menu> menu);
}
