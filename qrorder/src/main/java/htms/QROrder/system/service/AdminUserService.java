package htms.QROrder.system.service;

import com.github.f4b6a3.ulid.UlidCreator;
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

    public List<AdminUserResponse> getAdminUser(String searchKeyword) {

        return adminUserMapper.getAdminUser(searchKeyword);
    }

    public void saveAdminUser(AdminUserRequest adminUserRequest,
                                String userId,
                                String sysPlantCd) {

        List<AdminUser> newItems = adminUserRequest.getNewItems();
        List<AdminUser> updateItems = adminUserRequest.getUpdateItems();
        List<AdminUser> delItems = adminUserRequest.getDelItems();

        if(!newItems.isEmpty()){

            if(duplicateChk(newItems)) {
                List<AdminUserResponse> deuplicateAdminUser = getDuplicateData(newItems);

                String result = deuplicateAdminUser.stream()
                    .map(u -> u.getUserNm() + "(" + u.getUserId() + ")")
                    .collect(Collectors.joining(", "));

                throw new DuplicateException("중복된 데이터가 존재합니다.\n" + result);
            }

            newItems.forEach(adminUser -> {
                adminUser.setSysId(UlidCreator.getUlid().toString());
            });

            adminUserMapper.newAdminUser(newItems, userId, sysPlantCd);
        }

        if(!updateItems.isEmpty()){

            adminUserMapper.updateAdminUser(updateItems, userId, sysPlantCd);
        }

        if(!delItems.isEmpty()){

            adminUserMapper.deleteAdminUser(delItems, userId, sysPlantCd);
        }
    }

    public boolean duplicateChk(List<AdminUser> adminUser) {

        return adminUserMapper.duplicateChk(adminUser);
    }

    public List<AdminUserResponse> getDuplicateData(List<AdminUser> adminUser) {

        return adminUserMapper.getDuplicateData(adminUser);
    }
}
