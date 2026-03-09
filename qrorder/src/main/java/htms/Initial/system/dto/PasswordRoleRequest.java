package htms.Initial.system.dto;

import htms.Initial.system.domain.PasswordRole;
import lombok.Data;

import java.util.List;

@Data
public class PasswordRoleRequest {
    private List<PasswordRole> newPasswordRoles;
    private List<PasswordRole> updatePasswordRoles;
}
