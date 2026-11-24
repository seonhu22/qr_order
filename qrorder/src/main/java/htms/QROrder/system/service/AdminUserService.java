package htms.QROrder.system.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.audit.service.AuditService;
import htms.QROrder.common.exception.DuplicateException;
import htms.QROrder.system.billing.repository.SubscriptionMapper;
import htms.QROrder.system.domain.AdminUser;
import htms.QROrder.system.dto.AdminUserRequest;
import htms.QROrder.system.dto.AdminUserResponse;
import htms.QROrder.system.repository.AdminUserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class AdminUserService {
    private final AdminUserMapper adminUserMapper;
    private final AuditService auditService;
    private final PasswordEncoder passwordEncoder;
    private final SubscriptionMapper subscriptionMapper;

    @Value("${auth.default-password}")
    private String defaultPassword;

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

        if (Stream.concat(newItems.stream(), updateItems.stream())
                .anyMatch(user -> !"ADMIN".equals(user.getPlantCd()))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "사업장은 시스템 관리(ADMIN)만 선택할 수 있습니다.");
        }

        rejectOpenSubscriptionOwners(delItems);
        List<AdminUser> oldData = updateItems.isEmpty() ? List.of() : lockAdminRows(updateItems);

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

            updateAdminUser(userId, sysPlantCd, menuCd, updateItems, oldData);
        }

        if(!delItems.isEmpty()){

            delAdminUser(userId, sysPlantCd, menuCd, delItems);
        }
    }

    /** 잠금 순서 구독 → 사용자라 sys_user 쓰기 전에 확인한다. 진행 중 구독 대표는 해지/종료 뒤에만 지운다(정책 4C §3 E7). */
    private void rejectOpenSubscriptionOwners(List<AdminUser> delItems) {
        List<String> ids = delItems.stream().map(AdminUser::getSysId)
                .filter(Objects::nonNull).distinct().sorted().toList();
        if (!ids.isEmpty() && !subscriptionMapper.lockOpenByOwners(ids).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "진행 중인 구독의 대표입니다. 구독 해지를 먼저 진행해주세요.");
        }
    }

    /** 수정 대상은 이미 ADMIN 소속이고 삭제되지 않은 행만. 하나라도 아니면 쓰기 전에 404. */
    private List<AdminUser> lockAdminRows(List<AdminUser> updateItems) {
        long requested = updateItems.stream().map(AdminUser::getSysId).distinct().count();
        List<AdminUser> oldData = getOldData(updateItems);
        if (updateItems.stream().anyMatch(item -> item.getSysId() == null) || oldData.size() != requested) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "시스템 관리 계정을 찾을 수 없습니다.");
        }
        return oldData;
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
                                    List<AdminUser> updateItems,
                                    List<AdminUser> oldData) {

        auditService.insertUpdateAuditTrailData(oldData, updateItems, menuCd, "sys_user", userId, sysPlantCd);
        adminUserMapper.updateAdminUser(updateItems, userId, sysPlantCd);
    }

    private void newAdminUser(String userId,
                                String sysPlantCd,
                                String menuCd,
                                List<AdminUser> newItems) {

        String tempPwd = passwordEncoder.encode(defaultPassword);

        auditService.insertNewAuditTrailData(newItems, menuCd, "sys_user", userId, sysPlantCd);
        adminUserMapper.newAdminUser(newItems, userId, sysPlantCd, tempPwd);
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
