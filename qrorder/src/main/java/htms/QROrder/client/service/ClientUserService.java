package htms.QROrder.client.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.audit.service.AuditService;
import htms.QROrder.auth.domain.Login;
import htms.QROrder.client.dto.ClientUserItem;
import htms.QROrder.client.dto.ClientUserRequest;
import htms.QROrder.client.dto.ClientUserResponse;
import htms.QROrder.client.repository.ClientUserMapper;
import htms.QROrder.common.exception.DuplicateException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class ClientUserService {

    private final AuditService auditService;
    private final ClientUserMapper clientUserMapper;
    private final PasswordEncoder passwordEncoder;

    @Value("${auth.default-password}")
    private String defaultPassword;

    public List<ClientUserResponse> getClientUser(String searchKeyword,
                                                    String sysPlantCd) {

        return clientUserMapper.getClientUser(searchKeyword, sysPlantCd);
    }

    public void newClientUser(ClientUserRequest newItems,
                                String userId,
                                String sysPlantCd,
                                String menuCd) {

        if(duplicateChk(newItems)) {
            throw new DuplicateException("중복된 데이터가 존재합니다.\n" + newItems.getUserId());
        }

        String ULID = UlidCreator.getMonotonicUlid().toString();
        String tempPwd = passwordEncoder.encode(defaultPassword);

        newItems.setSysId(ULID);

        // auditService.insertNewAuditTrailData(newItems, ULID, menuCd, "sys_user", userId, sysPlantCd);
        clientUserMapper.newClientUser(newItems, userId, sysPlantCd, menuCd, tempPwd);
    }

    public void updateClientUser(ClientUserRequest updateItems,
                                    String userId,
                                    String sysPlantCd,
                                    String menuCd) {

        ClientUserResponse oldData = clientUserMapper.getOldData(updateItems.getSysId());

        // auditService.insertUpdateAuditTrailData(oldData, updateItems, updateItems.getSysId(), menuCd, "sys_user", userId, sysPlantCd);
        clientUserMapper.updateClientUser(updateItems, userId, sysPlantCd, menuCd);
    }

    public void delClientUser(List<ClientUserItem> delItems,
                                String userId,
                                String sysPlantCd,
                                String menuCd) {

        // auditService.insertDeleteAuditTrailData(delItems, menuCd, "sys_user", userId, sysPlantCd);
        clientUserMapper.delClientUser(delItems, userId, sysPlantCd, menuCd);
    }

    public void resetPwd(String sysId, Login actor) {
        if (actor == null || !"01".equals(actor.getUserRole())
                || actor.getSysPlantCd() == null || actor.getSysPlantCd().isBlank()
                || "ADMIN".equals(actor.getSysPlantCd())) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "매장 관리자만 스태프의 비밀번호를 초기화할 수 있습니다.");
        }
        String tempPwd = passwordEncoder.encode(defaultPassword);
        if (clientUserMapper.resetPwd(sysId, tempPwd, actor.getSysPlantCd(), actor.getUserId()) != 1) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "같은 매장의 스태프만 초기화할 수 있습니다. 매장 관리자 초기화는 관리자에게 이메일로 요청해주세요.");
        }
    }

    private boolean duplicateChk(ClientUserRequest clientUserRequest) {

        return clientUserMapper.duplicateChk(clientUserRequest);
    }
}
