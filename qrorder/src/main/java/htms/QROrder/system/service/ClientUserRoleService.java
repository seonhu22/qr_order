package htms.QROrder.system.service;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.system.repository.ClientUserRoleMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
@RequiredArgsConstructor
public class ClientUserRoleService {
    private final ClientUserRoleMapper mapper;
    public void promote(String sysId, Login actor) {
        if (actor == null || !"ADMIN".equals(actor.getSysPlantCd())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "시스템 관리자만 승격할 수 있습니다.");
        }
        if (sysId == null || sysId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "대상 아이디를 확인해주세요.");
        }
        var target = mapper.lockForPromotion(sysId);
        if (target == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "대상 사용자를 찾을 수 없습니다.");
        if (target.getPlantCd() == null || target.getPlantCd().isBlank() || "ADMIN".equals(target.getPlantCd())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "일반 매장 계정만 승격할 수 있습니다.");
        }
        if ("01".equals(target.getUserRole())) return;
        if (!"02".equals(target.getUserRole())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "스태프만 매장 관리자로 승격할 수 있습니다.");
        }
        if (mapper.promote(sysId, target.getPlantCd(), actor.getUserId()) != 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "대상이 변경되어 승격하지 못했습니다.");
        }
    }
}
