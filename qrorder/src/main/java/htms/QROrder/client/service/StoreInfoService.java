package htms.QROrder.client.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.audit.service.AuditService;
import htms.QROrder.client.dto.*;
import htms.QROrder.client.repository.StoreInfoMapper;
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
public class StoreInfoService {

    private final AuditService auditService;
    private final StoreInfoMapper storeInfoMapper;

    public List<StoreInfoResponse> getStoreInfo(String searchKeyword,
                                                    String sysPlantCd) {

        return storeInfoMapper.getStoreInfo(searchKeyword, sysPlantCd);
    }

    public void newStoreInfo(StoreInfoRequest newItems,
                             String userId,
                             String sysPlantCd,
                             String menuCd) {

        if(duplicateChk(newItems)) {
            throw new DuplicateException("중복된 데이터가 존재합니다.\n" + newItems.getStoreName());
        }

        String ULID = UlidCreator.getMonotonicUlid().toString();

        newItems.setSysId(ULID);

        auditService.insertNewAuditTrailData(newItems, ULID, menuCd, "store_info", userId, sysPlantCd);
        storeInfoMapper.newStoreInfo(newItems, userId, sysPlantCd, menuCd);
    }

    public void updateStoreInfo(StoreInfoRequest updateItems,
                                String userId,
                                String sysPlantCd,
                                String menuCd) {

        StoreInfoResponse oldData = storeInfoMapper.getOldData(updateItems.getSysId());

        auditService.insertUpdateAuditTrailData(oldData, updateItems, updateItems.getSysId(), menuCd, "store_info", userId, sysPlantCd);
        storeInfoMapper.updateStoreInfo(updateItems, userId, sysPlantCd, menuCd);
    }

    public void delStoreInfo(List<StoreInfoItem> delItems,
                                String userId,
                                String sysPlantCd,
                                String menuCd) {

        auditService.insertDeleteAuditTrailData(delItems, menuCd, "store_info", userId, sysPlantCd);
        storeInfoMapper.delStoreInfo(delItems, userId, sysPlantCd, menuCd);
    }

    private boolean duplicateChk(StoreInfoRequest storeInfoRequest) {

        return storeInfoMapper.duplicateChk(storeInfoRequest);
    }
}
