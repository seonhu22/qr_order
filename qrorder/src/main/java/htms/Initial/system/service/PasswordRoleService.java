package htms.Initial.system.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.Initial.audit.service.AuditService;
import htms.Initial.system.domain.PasswordRole;
import htms.Initial.system.dto.PasswordRoleRequest;
import htms.Initial.system.repository.PasswordRoleMapper;
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
public class PasswordRoleService {
    private final PasswordRoleMapper passwordRoleMapper;
    private final AuditService auditService;

    public List<PasswordRole> getPasswordRole(String searchKeyword) {

        return passwordRoleMapper.getPasswordRole(searchKeyword);
    }

    public void savePasswordRole(PasswordRoleRequest passwordRoleRequest,
                                    String userId,
                                    String sysPlantCd,
                                    String menuCd) {

        if(!passwordRoleRequest.getNewPasswordRoles().isEmpty()){
            newPasswordRole(passwordRoleRequest.getNewPasswordRoles(), userId, sysPlantCd, menuCd);
        }
        if(!passwordRoleRequest.getUpdatePasswordRoles().isEmpty()) {
            updatePasswordRole(passwordRoleRequest.getUpdatePasswordRoles(), userId, sysPlantCd, menuCd);
        }
    }

    public void newPasswordRole(List<PasswordRole> newPasswordRoles,
                                String userId,
                                String sysPlantCd,
                                String menuCd) {

        newPasswordRoles.forEach(item -> item.setSysId(UlidCreator.getMonotonicUlid().toString()));
        auditService.insertNewAuditTrailData(newPasswordRoles, menuCd, "sys_password_role", userId, sysPlantCd);
        passwordRoleMapper.newPasswordRole(newPasswordRoles, userId, sysPlantCd);
    }

    public void updatePasswordRole(List<PasswordRole> updatePasswordRoles,
                                String userId,
                                String sysPlantCd,
                                String menuCd) {

        List<String> ids = updatePasswordRoles.stream().map(PasswordRole::getSysId).collect(Collectors.toList());
        List<PasswordRole> oldItems = passwordRoleMapper.getOldPasswordRoleByIds(ids);
        auditService.insertUpdateAuditTrailData(oldItems, updatePasswordRoles, menuCd, "sys_password_role", userId, sysPlantCd);
        passwordRoleMapper.updatePasswordRole(updatePasswordRoles, userId, sysPlantCd);
    }
}
