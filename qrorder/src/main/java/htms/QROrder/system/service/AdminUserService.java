package htms.QROrder.system.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.system.domain.AdminUser;
import htms.QROrder.system.dto.AdminUserRequest;
import htms.QROrder.system.dto.AdminUserResponse;
import htms.QROrder.system.repository.AdminUserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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
}
