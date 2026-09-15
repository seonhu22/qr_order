package htms.QROrder.client.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.audit.service.AuditService;
import htms.QROrder.client.dto.MenuMasterItem;
import htms.QROrder.client.dto.MenuMasterRequest;
import htms.QROrder.client.dto.MenuMasterResponse;
import htms.QROrder.client.repository.MenuMasterMapper;
import htms.QROrder.common.exception.DuplicateException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class MenuMasterService {

    private final AuditService auditService;
    private final MenuMasterMapper menuMasterMapper;

    public List<MenuMasterResponse> getMenuMaster(String searchKeyword,
                                                    String sysPlantCd) {

        return menuMasterMapper.getMenuMaster(searchKeyword, sysPlantCd);
    }

    public void newMenuMaster(MenuMasterRequest newItems,
                                    String userId,
                                    String sysPlantCd,
                                    String menuCd) {
        /*
         * 20260716
         * 지점마다 같은 카테고리가 존재할 수도 있기 때문에 중복 데이터 체크 로직 임시 주석 처리
        if(duplicateChk(newItems)) {
            throw new DuplicateException("중복된 데이터가 존재합니다.\n" + newItems.getCategoryName());
        }
        */

        String ULID = UlidCreator.getMonotonicUlid().toString();
        newItems.setSysId(ULID);

        // auditService.insertNewAuditTrailData(newItems, ULID, menuCd, "store_menu_master", userId, sysPlantCd);
        menuMasterMapper.newMenuMaster(newItems, userId, sysPlantCd);
    }

    public void updateMenuMaster(MenuMasterRequest updateItems,
                                    String userId,
                                    String sysPlantCd,
                                    String menuCd) {

        MenuMasterResponse oldData = menuMasterMapper.getOldData(updateItems.getSysId());

        // auditService.insertUpdateAuditTrailData(oldData, updateItems, updateItems.getSysId(),  menuCd, "store_menu_master", userId, sysPlantCd);
        menuMasterMapper.updateMenuMaster(updateItems, userId, sysPlantCd);
    }

    public void delMenuMaster(List<MenuMasterItem> delItems,
                                String userId,
                                String sysPlantCd,
                                String menuCd) {

        // auditService.insertDeleteAuditTrailData(delItems, menuCd, "store_menu_master", userId, sysPlantCd);
        menuMasterMapper.delMenuMaster(delItems, userId, sysPlantCd, menuCd);
    }

    private boolean duplicateChk(MenuMasterRequest menuMasterRequest) {

        return menuMasterMapper.duplicateChk(menuMasterRequest);
    }
}
