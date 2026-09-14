package htms.QROrder.client.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.audit.service.AuditService;
import htms.QROrder.client.dto.*;
import htms.QROrder.client.repository.TableGuiMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class TableGuiService {

    private final AuditService auditService;
    private final TableGuiMapper tableGuiMapper;

    public List<TableGuiResponse> getTableGui(String sysPlantCd) {

        return tableGuiMapper.getTableGui(sysPlantCd);
    }

    public void saveTableGui(TableGuiRequest tableGuiRequest,
                                String userId,
                                String sysPlantCd,
                                String menuCd) {

        List<TableGuiItem> newItems = tableGuiRequest.getNewItems();
        List<TableGuiItem> updateItems = tableGuiRequest.getUpdateItems();
        List<TableGuiItem> delItems = tableGuiRequest.getDelItems();

        if(!newItems.isEmpty()) {
            newTableGui(newItems, userId, sysPlantCd, menuCd);
        }
        if(!updateItems.isEmpty()) {
            updateTableGui(updateItems, userId, sysPlantCd, menuCd);
        }
        if(!delItems.isEmpty()) {
            delTableGui(delItems, userId, sysPlantCd, menuCd);
        }
    }

    private void newTableGui(List<TableGuiItem> newItems,
                                String userId,
                                String sysPlantCd,
                                String menuCd) {

        newItems.forEach(item -> {
            item.setSysId(UlidCreator.getMonotonicUlid().toString());
        });

        // auditService.insertNewAuditTrailData(newItems, menuCd, "table_info", userId, sysPlantCd);
        tableGuiMapper.newTableGui(newItems, userId, sysPlantCd);
    }

    private void updateTableGui(List<TableGuiItem> updateItems,
                                    String userId,
                                    String sysPlantCd,
                                    String menuCd) {

        List<TableGuiItem> oldData = tableGuiMapper.getOldData(updateItems);

        // auditService.insertUpdateAuditTrailData(oldData, updateItems, menuCd, "table_info", userId, sysPlantCd);
        tableGuiMapper.updateTableGui(updateItems, userId);
    }

    private void delTableGui(List<TableGuiItem> delItems,
                                String userId,
                                String sysPlantCd,
                                String menuCd) {

        // auditService.insertDeleteAuditTrailData(delItems, menuCd, "table_info", userId, sysPlantCd);
        tableGuiMapper.delTableGui(delItems, userId);
    }
}
