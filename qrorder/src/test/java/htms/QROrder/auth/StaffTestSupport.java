package htms.QROrder.auth;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.auth.repository.LoginMapper;
import static org.mockito.Mockito.*;

/** Independent, complete session fixtures for the authenticated staff contract. */
public final class StaffTestSupport {
    private StaffTestSupport() {}
    public static Login login(String userId, String store, String role) {
        var user = new Login();
        user.setSysId(userId); user.setUserId(userId); user.setUserNm(userId);
        user.setSysPlantCd(store); user.setUserRole(role); user.setInitYn("N");
        user.setEmailValidYn("Y"); user.setPasswordFailCnt(0);
        return user;
    }
    public static LoginMapper mapperFor(Login user) {
        var mapper = mock(LoginMapper.class);
        when(mapper.findForAuthorization(user.getSysId())).thenReturn(user);
        return mapper;
    }
}
