package htms.Initial.popup.repository;

import htms.Initial.auth.dto.ChangePwdRequest;
import htms.Initial.popup.dto.PopupPasswordRole;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface PopupPasswordRoleMapper {
    public PopupPasswordRole getPasswordRole(String sysPlantCd);
    public void changePassword(ChangePwdRequest changePwdRequest);
    public String chkPasswordCorrect(ChangePwdRequest changePwdRequest);
}
