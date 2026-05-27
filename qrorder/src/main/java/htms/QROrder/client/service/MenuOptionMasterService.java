package htms.QROrder.client.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.audit.service.AuditService;
import htms.QROrder.client.dto.*;
import htms.QROrder.client.repository.MenuOptionMasterMapper;
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
public class MenuOptionMasterService {

    private final AuditService auditService;
    private final MenuOptionMasterMapper menuOptionMasterMapper;

    public List<MenuOptionMasterResponse> getMenuOptionMaster(String searchKeyword,
                                                                String sysPlantCd) {

        return menuOptionMasterMapper.getMenuOptionMaster(searchKeyword, sysPlantCd);
    }

    public void newMenuOptionMaster(MenuOptionMasterRequest newItems,
                              String userId,
                              String sysPlantCd,
                              String menuCd) {

        if(duplicateChk(newItems)) {
            throw new DuplicateException("중복된 데이터가 존재합니다.\n" + newItems.getCategoryName());
        }

        String ULID = UlidCreator.getMonotonicUlid().toString();
        newItems.setSysId(ULID);

        auditService.insertNewAuditTrailData(newItems, ULID, menuCd, "store_menu_option_master", userId, sysPlantCd);
        menuOptionMasterMapper.newMenuOptionMaster(newItems, userId, sysPlantCd);
    }

    public void updateMenuOptionMaster(MenuOptionMasterRequest updateItems,
                                 String userId,
                                 String sysPlantCd,
                                 String menuCd) {

        MenuOptionMasterResponse oldData = menuOptionMasterMapper.getOldData(updateItems.getSysId());

        auditService.insertUpdateAuditTrailData(oldData, updateItems, updateItems.getSysId(),  menuCd, "store_menu_option_master", userId, sysPlantCd);
        menuOptionMasterMapper.updateMenuOptionMaster(updateItems, userId, sysPlantCd);
    }

    public void delMenuOptionMaster(List<MenuOptionMasterItem> delItems,
                              String userId,
                              String sysPlantCd,
                              String menuCd) {

        auditService.insertDeleteAuditTrailData(delItems, menuCd, "store_menu_option_master", userId, sysPlantCd);
        menuOptionMasterMapper.delMenuOptionMaster(delItems, userId, sysPlantCd, menuCd);
    }

    private boolean duplicateChk(MenuOptionMasterRequest menuOptionMasterRequest) {

        return menuOptionMasterMapper.duplicateChk(menuOptionMasterRequest);
    }
}
