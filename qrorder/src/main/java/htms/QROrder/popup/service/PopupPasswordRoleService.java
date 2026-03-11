package htms.QROrder.popup.service;

import htms.QROrder.auth.dto.ChangePwdRequest;
import htms.QROrder.common.exception.ValidationException;
import htms.QROrder.popup.repository.PopupPasswordRoleMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class PopupPasswordRoleService {

    private final PasswordEncoder passwordEncoder;
    private final PopupPasswordRoleMapper popupPasswordRoleMapper;

    public void changePassword(ChangePwdRequest changePwdRequest,
                                String sysPlantCd) {

        String dbPwd = chkPasswordCorrect(changePwdRequest);
        String oldPwd = changePwdRequest.getOldPwd();

        try {
            if(passwordEncoder.matches(oldPwd, dbPwd)){
                changePwdRequest.setOldPwd(passwordEncoder.encode(changePwdRequest.getOldPwd()));
                changePwdRequest.setNewPwd(passwordEncoder.encode(changePwdRequest.getNewPwd()));
                changePwdRequest.setChkNewPwd(passwordEncoder.encode(changePwdRequest.getChkNewPwd()));
            }
            else {
                throw new ValidationException("이전 비밀번호가 일치하지 않습니다.");
            }
        }
        catch (ValidationException e) {
            throw new ValidationException(e.getMessage());
        }

        popupPasswordRoleMapper.changePassword(changePwdRequest);
    }

    public String chkPasswordCorrect(ChangePwdRequest changePwdRequest) {

        return popupPasswordRoleMapper.chkPasswordCorrect(changePwdRequest);
    }
}
