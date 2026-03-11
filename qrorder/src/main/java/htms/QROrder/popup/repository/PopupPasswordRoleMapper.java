package htms.QROrder.popup.repository;

import htms.QROrder.auth.dto.ChangePwdRequest;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface PopupPasswordRoleMapper {
    public void changePassword(ChangePwdRequest changePwdRequest);
    public String chkPasswordCorrect(ChangePwdRequest changePwdRequest);
}
