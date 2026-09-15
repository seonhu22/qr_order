package htms.QROrder.client.repository;

import htms.QROrder.client.dto.ClientUserItem;
import htms.QROrder.client.dto.ClientUserRequest;
import htms.QROrder.client.dto.ClientUserResponse;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface ClientUserMapper {
    List<ClientUserResponse> getClientUser(String searchKeyword, String sysPlantCd);
    void newClientUser(ClientUserRequest newItems, String userId, String sysPlantCd, String menuCd, String tempPwd);
    void updateClientUser(ClientUserRequest updateItems, String userId, String sysPlantCd, String menuCd);
    void delClientUser(List<ClientUserItem> delItems, String userId, String sysPlantCd, String menuCd);
    void resetPwd(String sysId, String tempPwd);
    ClientUserResponse getOldData(String sysId);
    boolean duplicateChk(ClientUserRequest clientUserRequest);
}
