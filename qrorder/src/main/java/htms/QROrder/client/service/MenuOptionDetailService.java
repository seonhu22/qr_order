package htms.QROrder.client.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.audit.service.AuditService;
import htms.QROrder.client.dto.MenuOptionDetailItem;
import htms.QROrder.client.dto.MenuOptionDetailRequest;
import htms.QROrder.client.dto.MenuOptionDetailResponse;
import htms.QROrder.client.repository.MenuOptionDetailMapper;
import htms.QROrder.common.dto.FileRequest;
import htms.QROrder.common.exception.DuplicateException;
import htms.QROrder.common.service.FileService;
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
public class MenuOptionDetailService {

    private final AuditService auditService;
    private final MenuOptionDetailMapper menuOptionDetailMapper;
    private final FileService fileService;

    public List<MenuOptionDetailResponse> getMenuOptionDetail(String masterSysId) {

        return menuOptionDetailMapper.getMenuOptionDetail(masterSysId);
    }

    public void saveMenuOptionDetail(MenuOptionDetailRequest menuOptionDetailRequest,
                                        FileRequest fileRequest,
                                        String userId,
                                        String sysPlantCd,
                                        String menuCd) {

        List<MenuOptionDetailItem> newItems = menuOptionDetailRequest.getNewItems();
        List<MenuOptionDetailItem> updateItems = menuOptionDetailRequest.getUpdateItems();
        List<MenuOptionDetailItem> delItems = menuOptionDetailRequest.getDelItems();

        if(!newItems.isEmpty()) {
            if(duplicateChk(newItems)) {
                List<MenuOptionDetailItem> duplicateData = getDuplicateData(newItems);

                String result = duplicateData.stream()
                        .map(MenuOptionDetailItem::getMenuOptionName)
                        .collect(Collectors.joining(", "));

                throw new DuplicateException("중복된 데이터가 존재합니다.\n" + result);
            }

            newMenuOptionDetail(newItems, userId, sysPlantCd, menuCd);
        }
        if(!updateItems.isEmpty()) {
            updateMenuOptionDetail(updateItems, userId, sysPlantCd, menuCd);
        }
        if(!delItems.isEmpty()) {
            delMenuOptionDetail(delItems, userId, sysPlantCd, menuCd);
        }

        fileService.saveFile(fileRequest, userId, sysPlantCd, menuCd);
    }

    private void newMenuOptionDetail(List<MenuOptionDetailItem> newItems,
                                        String userId,
                                        String sysPlantCd,
                                        String menuCd) {

        newItems.forEach(item -> {
            String ULID = UlidCreator.getMonotonicUlid().toString();
            item.setSysId(ULID);
        });

        auditService.insertNewAuditTrailData(newItems, menuCd, "store_menu_option_detail", userId, sysPlantCd);
        menuOptionDetailMapper.newMenuOptionDetail(newItems, userId, sysPlantCd, menuCd);
    }

    private void updateMenuOptionDetail(List<MenuOptionDetailItem> updateItems,
                                            String userId,
                                            String sysPlantCd,
                                            String menuCd) {

        List<MenuOptionDetailItem> oldData = getOldData(updateItems);

        auditService.insertUpdateAuditTrailData(oldData, updateItems, menuCd, "store_menu_option_detail", userId, sysPlantCd);
        menuOptionDetailMapper.updateMenuOptionDetail(updateItems, userId, sysPlantCd, menuCd);
    }

    private void delMenuOptionDetail(List<MenuOptionDetailItem> delItems,
                                        String userId,
                                        String sysPlantCd,
                                        String menuCd) {

        auditService.insertDeleteAuditTrailData(delItems, menuCd, "store_menu_option_detail", userId, sysPlantCd);
        menuOptionDetailMapper.delMenuOptionDetail(delItems, userId, sysPlantCd, menuCd);
    }

    private List<MenuOptionDetailItem> getDuplicateData(List<MenuOptionDetailItem> qrCodeItem) {

        return menuOptionDetailMapper.getDuplicateData(qrCodeItem);
    }

    private boolean duplicateChk(List<MenuOptionDetailItem> newItems) {

        return menuOptionDetailMapper.duplicateChk(newItems);
    }

    private List<MenuOptionDetailItem> getOldData(List<MenuOptionDetailItem> qrCodeItem) {

        return menuOptionDetailMapper.getOldData(qrCodeItem);
    }
}
