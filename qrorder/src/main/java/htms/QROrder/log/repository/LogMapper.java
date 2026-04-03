package htms.QROrder.log.repository;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface LogMapper {
    public void insertLoginLog(@Param("uuid") String uuid,
                               @Param("ip") String ip,
                               @Param("successStatus") String successStatus,
                               @Param("errMsg") String errMsg,
                               @Param("userId") String userId,
                               @Param("sysPlantCd") String sysPlantCd);
    public void insertLogoutLog(@Param("uuid") String uuid);
    public void insertMenuOpenAccessLog(@Param("menuUuid") String menuUuid,
                                        @Param("logUuid") String logUuid,
                                        @Param("menuCd") String menuCd);
    public void insertMenuCloseAccessLog(@Param("menuUuid") String menuUuid);
    public void closeAllOpenSessions();
    public void closeAllOpenMenuSessions();
}
