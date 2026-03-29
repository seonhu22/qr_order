package htms.QROrder.system.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.audit.service.AuditService;
import htms.QROrder.common.exception.DuplicateException;
import htms.QROrder.system.domain.AdminUser;
import htms.QROrder.system.dto.AdminUserRequest;
import htms.QROrder.system.dto.AdminUserResponse;
import htms.QROrder.system.repository.AdminUserMapper;
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
public class AdminUserService {
    private final AdminUserMapper adminUserMapper;
    private final AuditService auditService;

    public List<AdminUserResponse> getAdminUser(String searchKeyword) {

        return adminUserMapper.getAdminUser(searchKeyword);
    }

    public void saveAdminUser(AdminUserRequest adminUserRequest,
                                String userId,
                                String sysPlantCd,
                                String menuCd) {

        List<AdminUser> newItems = adminUserRequest.getNewItems();
        List<AdminUser> updateItems = adminUserRequest.getUpdateItems();
        List<AdminUser> delItems = adminUserRequest.getDelItems();

        if(!newItems.isEmpty()){

            if(duplicateChk(newItems)) {
                List<AdminUserResponse> duplicateData = getDuplicateData(newItems);

                String result = duplicateData.stream()
                    .map(u -> u.getUserNm() + "(" + u.getUserId() + ")")
                    .collect(Collectors.joining(", "));

                throw new DuplicateException("중복된 데이터가 존재합니다.\n" + result);
            }

            newItems.forEach(adminUser -> {
                adminUser.setSysId(UlidCreator.getUlid().toString());
            });

            newAdminUser(userId, sysPlantCd, menuCd, newItems);
        }

        if(!updateItems.isEmpty()){

            updateAdminUser(userId, sysPlantCd, menuCd, updateItems);
        }

        if(!delItems.isEmpty()){

            delAdminUser(userId, sysPlantCd, menuCd, delItems);
        }
    }

    private void delAdminUser(String userId,
                                String sysPlantCd,
                                String menuCd,
                                List<AdminUser> delItems) {

        auditService.insertDeleteAuditTrailData(delItems, menuCd, "sys_user", userId, sysPlantCd);
        adminUserMapper.deleteAdminUser(delItems, userId, sysPlantCd);
    }

    private void updateAdminUser(String userId,
                                    String sysPlantCd,
                                    String menuCd,
                                    List<AdminUser> updateItems) {

        List<AdminUser> oldData = getOldData(updateItems);

        auditService.insertUpdateAuditTrailData(oldData, updateItems, menuCd, "sys_user", userId, sysPlantCd);
        adminUserMapper.updateAdminUser(updateItems, userId, sysPlantCd);
    }

    private void newAdminUser(String userId,
                                String sysPlantCd,
                                String menuCd,
                                List<AdminUser> newItems) {

        auditService.insertNewAuditTrailData(newItems, menuCd, "sys_user", userId, sysPlantCd);
        adminUserMapper.newAdminUser(newItems, userId, sysPlantCd);
    }

    private boolean duplicateChk(List<AdminUser> adminUser) {

        return adminUserMapper.duplicateChk(adminUser);
    }

    private List<AdminUserResponse> getDuplicateData(List<AdminUser> adminUser) {

        return adminUserMapper.getDuplicateData(adminUser);
    }

    private List<AdminUser> getOldData(List<AdminUser> adminUser) {

        return adminUserMapper.getOldData(adminUser);
    }
}
