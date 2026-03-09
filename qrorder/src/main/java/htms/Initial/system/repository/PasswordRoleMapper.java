package htms.Initial.system.repository;

import htms.Initial.system.domain.PasswordRole;
import htms.Initial.system.dto.PasswordRoleRequest;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface PasswordRoleMapper {
    public List<PasswordRole> getPasswordRole(String searchKeyword);
    public void savePasswordRole(PasswordRoleRequest passwordRoleRequest, String userId, String sysPlantCd);
    public void newPasswordRole(List<PasswordRole> newPasswordRoles, String userId, String sysPlantCd);
    public void updatePasswordRole(List<PasswordRole> updatePasswordRoles, String userId, String sysPlantCd);
    public List<PasswordRole> getOldPasswordRoleByIds(List<String> ids);
}
