package htms.QROrder.log.repository;

import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface LogMapper {
    public void insertLoginLog(String uuid, String ip, String successStatus, String errMsg, String userId, String sysPlantCd);
    public void insertLogoutLog(String uuid);
    public void insertMenuOpenAccessLog(String menuUuid, String logUuid, String menuCd);
    public void insertMenuCloseAccessLog(String menuUuid);
    public void closeAllOpenSessions();
    public void closeAllOpenMenuSessions();
}
