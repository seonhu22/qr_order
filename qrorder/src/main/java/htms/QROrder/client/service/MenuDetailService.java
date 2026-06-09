package htms.QROrder.client.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.audit.service.AuditService;
import htms.QROrder.client.dto.*;
import htms.QROrder.client.repository.MenuDetailMapper;
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
public class MenuDetailService {

    private final AuditService auditService;
    private final MenuDetailMapper menuDetailMapper;
    private final FileService fileService;

    public List<MenuDetailResponse> getMenuDetail(String masterSysId) {

        return menuDetailMapper.getMenuDetail(masterSysId);
    }

    public void saveMenuDetail(MenuDetailRequest menuDetailRequest,
                                    FileRequest fileRequest,
                                    String userId,
                                    String sysPlantCd,
                                    String menuCd) {

        List<MenuDetailItem> newItems = menuDetailRequest.getNewItems();
        List<MenuDetailItem> updateItems = menuDetailRequest.getUpdateItems();
        List<MenuDetailItem> delItems = menuDetailRequest.getDelItems();

        if(!newItems.isEmpty()) {
            if(duplicateChk(newItems)) {
                List<MenuDetailItem> duplicateData = getDuplicateData(newItems);

                String result = duplicateData.stream()
                        .map(MenuDetailItem::getMenuName)
                        .collect(Collectors.joining(", "));

                throw new DuplicateException("중복된 데이터가 존재합니다.\n" + result);
            }

            newMenuDetail(newItems, userId, sysPlantCd, menuCd);
        }
        if(!updateItems.isEmpty()) {
            updateMenuDetail(updateItems, userId, sysPlantCd, menuCd);
        }
        if(!delItems.isEmpty()) {
            delMenuDetail(delItems, userId, sysPlantCd, menuCd);
        }

        fileService.saveFile(fileRequest, userId, sysPlantCd, menuCd);
    }

    private void newMenuDetail(List<MenuDetailItem> newItems,
                                    String userId,
                                    String sysPlantCd,
                                    String menuCd) {

        newItems.forEach(item -> {
            String ULID = UlidCreator.getMonotonicUlid().toString();
            item.setSysId(ULID);
        });

        auditService.insertNewAuditTrailData(newItems, menuCd, "store_menu_detail", userId, sysPlantCd);
        menuDetailMapper.newMenuDetail(newItems, userId, sysPlantCd, menuCd);
    }

    private void updateMenuDetail(List<MenuDetailItem> updateItems,
                                String userId,
                                String sysPlantCd,
                                String menuCd) {

        List<MenuDetailItem> oldData = getOldData(updateItems);

        auditService.insertUpdateAuditTrailData(oldData, updateItems, menuCd, "store_menu_detail", userId, sysPlantCd);
        menuDetailMapper.updateMenuDetail(updateItems, userId, sysPlantCd, menuCd);
    }

    private void delMenuDetail(List<MenuDetailItem> delItems,
                            String userId,
                            String sysPlantCd,
                            String menuCd) {

        auditService.insertDeleteAuditTrailData(delItems, menuCd, "store_menu_detail", userId, sysPlantCd);
        menuDetailMapper.delMenuDetail(delItems, userId, sysPlantCd, menuCd);
    }

    private List<MenuDetailItem> getDuplicateData(List<MenuDetailItem> qrCodeItem) {

        return menuDetailMapper.getDuplicateData(qrCodeItem);
    }

    private boolean duplicateChk(List<MenuDetailItem> newItems) {

        return menuDetailMapper.duplicateChk(newItems);
    }

    private List<MenuDetailItem> getOldData(List<MenuDetailItem> qrCodeItem) {

        return menuDetailMapper.getOldData(qrCodeItem);
    }
}
