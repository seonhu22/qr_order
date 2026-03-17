package htms.QROrder.system.repository;

import htms.QROrder.system.domain.AdminUser;
import htms.QROrder.system.dto.AdminUserResponse;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface AdminUserMapper {
    List<AdminUserResponse> getAdminUser(String searchKeyword);
    void newAdminUser(List<AdminUser> newItems, String userId, String sysPlantCd);
    void updateAdminUser(List<AdminUser> updateItems, String userId, String sysPlantCd);
    void deleteAdminUser(List<AdminUser> delItems, String userId, String sysPlantCd);
    boolean duplicateChk(List<AdminUser> adminUser);
    List<AdminUserResponse> getDuplicateData(List<AdminUser> adminUser);
}
