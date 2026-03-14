package htms.QROrder.system.dto;

import htms.QROrder.system.domain.AdminUser;
import lombok.Data;

import java.util.List;

@Data
public class AdminUserRequest {
    private List<AdminUser> newItems;
    private List<AdminUser> updateItems;
    private List<AdminUser> delItems;
}
