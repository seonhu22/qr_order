package htms.QROrder.client.repository;

import htms.QROrder.client.dto.ClientUserItem;
import htms.QROrder.client.dto.ClientUserRequest;
import htms.QROrder.client.dto.ClientUserResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ClientUserMapper {
    List<ClientUserResponse> getClientUser(String searchKeyword, String sysPlantCd);
    void newClientUser(ClientUserRequest newItems, String userId, String sysPlantCd, String menuCd, String tempPwd);
    int updateClientUser(@Param("updateItems") ClientUserRequest updateItems, @Param("userId") String userId,
                         @Param("sysPlantCd") String sysPlantCd, @Param("menuCd") String menuCd);
    List<ClientUserResponse> lockStaffUsers(@Param("ids") List<String> ids, @Param("sysPlantCd") String sysPlantCd);
    int delClientUser(@Param("ids") List<String> ids, @Param("userId") String userId, @Param("sysPlantCd") String sysPlantCd);
    int resetPwd(@Param("sysId") String sysId, @Param("tempPwd") String tempPwd,
                 @Param("sysPlantCd") String sysPlantCd, @Param("userId") String userId);
    boolean duplicateChk(ClientUserRequest clientUserRequest);
}
