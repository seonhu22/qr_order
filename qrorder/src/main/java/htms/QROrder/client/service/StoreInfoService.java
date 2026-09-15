package htms.QROrder.client.service;

import htms.QROrder.audit.service.AuditService;
import htms.QROrder.client.dto.*;
import htms.QROrder.client.repository.StoreInfoMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Objects;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class StoreInfoService {

    private final AuditService auditService;
    private final StoreInfoMapper storeInfoMapper;
    private final PasswordEncoder passwordEncoder;

    public boolean pwdChk(String pwd,
                            String userId) {

        String dbPwd = storeInfoMapper.pwdChk(userId);

        return passwordEncoder.matches(pwd, dbPwd);
    }

    public List<StoreInfoResponse> getStoreInfo(String searchKeyword,
                                                    String userId,
                                                    String sysPlantCd) {

        return storeInfoMapper.getStoreInfo(searchKeyword, userId, sysPlantCd);
    }

    public void saveStoreInfo(StoreInfoRequest updateItems,
                                String userId,
                                String sysPlantCd,
                                String menuCd) {

        StoreInfoResponse oldData = storeInfoMapper.getOldData(updateItems.getSysId());

        // auditService.insertUpdateAuditTrailData(oldData, updateItems, updateItems.getSysId(), menuCd, "store_info", userId, sysPlantCd);
        storeInfoMapper.updateStoreInfo(updateItems, userId, sysPlantCd);
    }
}
