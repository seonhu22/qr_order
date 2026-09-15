package htms.QROrder.client.service;

import htms.QROrder.client.dto.*;
import htms.QROrder.client.repository.SettlementMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class SettlementService {

    private final SettlementMapper settlementMapper;

    public SettlementResponse getSettlement(SettlementRequest settlementRequest,
                                                String userId,
                                                String sysPlantCd) {

        SettlementResponse settlementResponse = settlementMapper.getSettlementSummary(settlementRequest, userId, sysPlantCd);
        settlementResponse.setDailySales(settlementMapper.getSettlementDailyList(settlementRequest, userId, sysPlantCd));

        return settlementResponse;
    }
}
