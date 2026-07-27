package htms.QROrder.client.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.audit.service.AuditService;
import htms.QROrder.client.dto.TableInfoItem;
import htms.QROrder.client.dto.TableInfoRequest;
import htms.QROrder.client.dto.TableInfoResponse;
import htms.QROrder.client.repository.TableInfoMapper;
import htms.QROrder.common.exception.DuplicateException;
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
public class TableInfoService {

    private final AuditService auditService;
    private final TableInfoMapper tableInfoMapper;

    public List<TableInfoResponse> getTableInfo(String sysPlantCd) {

        return tableInfoMapper.getTableInfo(sysPlantCd);
    }

    public void saveTableInfo(TableInfoRequest tableInfoRequest,
                              String userId,
                              String sysPlantCd,
                              String menuCd) {

        List<TableInfoItem> newItems = tableInfoRequest.getNewItems();
        List<TableInfoItem> updateItems = tableInfoRequest.getUpdateItems();
        List<TableInfoItem> delItems = tableInfoRequest.getDelItems();

        if(!newItems.isEmpty()) {
            if(duplicateChk(newItems)) {
                List<TableInfoItem> duplicateData = getDuplicateData(newItems);

                String result = duplicateData.stream()
                        .map(item -> String.valueOf(item.getTableNum()))
                        .collect(Collectors.joining(", "));

                throw new DuplicateException("중복된 데이터가 존재합니다.\n" + result);
            }

            newTableInfo(newItems, userId, sysPlantCd, menuCd);
        }
        if(!updateItems.isEmpty()) {
            updateTableInfo(updateItems, userId, sysPlantCd, menuCd);
        }
        if(!delItems.isEmpty()) {
            delTableInfo(delItems, userId, sysPlantCd, menuCd);
        }
    }

    private void newTableInfo(List<TableInfoItem> newItems,
                             String userId,
                             String sysPlantCd,
                             String menuCd) {

        newItems.forEach(item -> {
            String ULID = UlidCreator.getMonotonicUlid().toString();
            item.setSysId(ULID);
        });

        // auditService.insertNewAuditTrailData(newItems, menuCd, "table_info", userId, sysPlantCd);
        tableInfoMapper.newTableInfo(newItems, userId, sysPlantCd, menuCd);
    }

    private void updateTableInfo(List<TableInfoItem> updateItems,
                                String userId,
                                String sysPlantCd,
                                String menuCd) {

        List<TableInfoItem> oldData = getOldData(updateItems);

        // auditService.insertUpdateAuditTrailData(oldData, updateItems, menuCd, "table_info", userId, sysPlantCd);
        tableInfoMapper.updateTableInfo(updateItems, userId, sysPlantCd, menuCd);
    }

    private void delTableInfo(List<TableInfoItem> delItems,
                                String userId,
                                String sysPlantCd,
                                String menuCd) {

        // auditService.insertDeleteAuditTrailData(delItems, menuCd, "table_info", userId, sysPlantCd);
        tableInfoMapper.delTableInfo(delItems, userId, sysPlantCd, menuCd);
    }

    private List<TableInfoItem> getDuplicateData(List<TableInfoItem> tableInfoItem) {

        return tableInfoMapper.getDuplicateData(tableInfoItem);
    }

    private boolean duplicateChk(List<TableInfoItem> newItems) {

        return tableInfoMapper.duplicateChk(newItems);
    }

    private List<TableInfoItem> getOldData(List<TableInfoItem> tableInfoItem) {

        return tableInfoMapper.getOldData(tableInfoItem);
    }
}
