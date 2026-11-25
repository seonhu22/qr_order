package htms.QROrder.system.service;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.system.billing.domain.Subscription;
import htms.QROrder.system.billing.repository.SubscriptionMapper;
import htms.QROrder.system.repository.ClientUserRoleMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class ClientUserRoleService {
    private final ClientUserRoleMapper mapper;
    private final SubscriptionMapper subscriptionMapper;

    public enum Promotion {
        /** 02를 01로 올렸다. */
        PROMOTED,
        /** 이미 01이고 바꿀 것이 없다(레거시/이미 영구 01). */
        ALREADY_MANAGER,
        /** 구독 결제가 올린 01을 영구 01로 바꿨다. */
        MADE_PERMANENT
    }

    /**
     * SUPER_ADMIN 수동 승격은 언제나 영구 01이다(정책 4C §4). 대상이 대표인 진행 중 구독의
     * role_granted_yn을 'N'으로 바꿔 구독 만료/환불 회수가 이 01을 내리지 않게 한다.
     * 잠금 순서: 구독 → 사용자.
     */
    public Promotion promote(String sysId, Login actor) {
        if (actor == null || !"ADMIN".equals(actor.getSysPlantCd())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "시스템 관리자만 승격할 수 있습니다.");
        }
        if (sysId == null || sysId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "대상 아이디를 확인해주세요.");
        }
        List<Subscription> owned = subscriptionMapper.lockOpenByOwners(List.of(sysId));
        var target = mapper.lockForPromotion(sysId);
        if (target == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "대상 사용자를 찾을 수 없습니다.");
        if (target.getPlantCd() == null || target.getPlantCd().isBlank() || "ADMIN".equals(target.getPlantCd())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "일반 매장 계정만 승격할 수 있습니다.");
        }
        if (!"01".equals(target.getUserRole()) && !"02".equals(target.getUserRole())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "스태프만 매장 관리자로 승격할 수 있습니다.");
        }
        boolean madePermanent = false;
        for (Subscription subscription : owned) {
            if ("Y".equals(subscription.getRoleGrantedYn())
                    && subscriptionMapper.markRolePermanent(subscription.getSysId(), actor.getUserId()) == 1) {
                madePermanent = true;
            }
        }
        if ("01".equals(target.getUserRole())) {
            return madePermanent ? Promotion.MADE_PERMANENT : Promotion.ALREADY_MANAGER;
        }
        if (mapper.promote(sysId, target.getPlantCd(), actor.getUserId()) != 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "대상이 변경되어 승격하지 못했습니다.");
        }
        return Promotion.PROMOTED;
    }
}
