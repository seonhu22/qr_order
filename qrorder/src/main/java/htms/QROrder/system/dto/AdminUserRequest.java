package htms.QROrder.system.dto;

import htms.QROrder.system.domain.AdminUser;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class AdminUserRequest {
    private List<AdminUser> newItems = new ArrayList<>();
    private List<AdminUser> updateItems = new ArrayList<>();
    private List<AdminUser> delItems = new ArrayList<>();
}
