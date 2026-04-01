package htms.QROrder.system.service;

import htms.QROrder.audit.service.AuditService;
import htms.QROrder.common.exception.DuplicateException;
import htms.QROrder.system.domain.CommonDetail;
import htms.QROrder.system.domain.Menu;
import htms.QROrder.system.dto.MenuRequest;
import htms.QROrder.system.repository.MenuMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class MenuService {

    private final MenuMapper menuMapper;
    private final AuditService auditService;

    public List<Menu> getMenu() {

        return menuMapper.getMenu();
    }

    public void saveMenu(MenuRequest menuRequest,
                            String userId,
                            String sysPlantCd,
                            String menuCd) {

        List<Menu> newItems = menuRequest.getNewItems();
        List<Menu> updateItems = menuRequest.getUpdateItems();
        List<Menu> delItems = menuRequest.getDelItems();

        if(!newItems.isEmpty()) {
            if(duplicateChk(newItems)) {
                List<Menu> duplicateAdminUser = getDuplicateData(newItems);

                String result = duplicateAdminUser.stream()
                        .map(u -> u.getMenuNm() + "(" + u.getMenuCd() + ")")
                        .collect(Collectors.joining(", "));

                throw new DuplicateException("중복된 데이터가 존재합니다.\n" + result);
            }

            newMenu(newItems, userId, sysPlantCd, menuCd);
        }
        if(!updateItems.isEmpty()) {
            updateMenu(updateItems, userId, sysPlantCd, menuCd);
        }
        if(!delItems.isEmpty()) {
            delMenu(delItems, userId, sysPlantCd, menuCd);
        }
    }

    private boolean duplicateChk(List<Menu> menu) {

        return menuMapper.duplicateChk(menu);
    }

    private List<Menu> getDuplicateData(List<Menu> menu) {

        return menuMapper.getDuplicateData(menu);
    }

    private List<Menu> getOldData(List<Menu> menu) {

        return menuMapper.getOldData(menu);
    }

    private void newMenu(List<Menu> newItems,
                            String userId,
                            String sysPlantCd,
                            String menuCd) {

        auditService.insertNewAuditTrailData(newItems, menuCd, "sys_menu", userId, sysPlantCd);
        menuMapper.newMenu(newItems, userId, sysPlantCd);
    }

    private void updateMenu(List<Menu> updateItems,
                            String userId,
                            String sysPlantCd,
                            String menuCd) {

        List<Menu> oldData = getOldData(updateItems);

        auditService.insertUpdateAuditTrailData(oldData, updateItems, menuCd, "sys_menu", userId, sysPlantCd);
        menuMapper.updateMenu(updateItems, userId, sysPlantCd);
    }

    private void delMenu(List<Menu> delItems,
                            String userId,
                            String sysPlantCd,
                            String menuCd) {

        List<String> ids = delItems.stream().map(Menu::getSysId).collect(Collectors.toList());

        auditService.insertDeleteAuditTrailData(delItems, menuCd, "sys_menu", userId, sysPlantCd);
        menuMapper.delMenu(ids, userId, sysPlantCd);
    }
}
