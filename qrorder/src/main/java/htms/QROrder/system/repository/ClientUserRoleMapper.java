package htms.QROrder.system.repository;

import htms.QROrder.client.dto.ClientUserResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface ClientUserRoleMapper {
    ClientUserResponse lockForPromotion(@Param("sysId") String sysId);
    int promote(@Param("sysId") String sysId, @Param("plantCd") String plantCd, @Param("userId") String userId);
}
