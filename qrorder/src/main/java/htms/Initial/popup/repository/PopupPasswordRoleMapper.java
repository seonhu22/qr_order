package htms.Initial.popup.repository;

import htms.Initial.auth.dto.ChangePwdRequest;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface PopupPasswordRoleMapper {
    public void changePassword(ChangePwdRequest changePwdRequest);
    public String chkPasswordCorrect(ChangePwdRequest changePwdRequest);
}
