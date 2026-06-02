package htms.QROrder.client.repository;

import htms.QROrder.client.dto.*;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SettlementMapper {
    SettlementResponse getSettlementSummary(SettlementRequest settlementRequest, String userId, String sysPlantCd);
    List<SettlementItem.dailySale> getSettlementDailyList(SettlementRequest settlementRequest, String userId, String sysPlantCd);
}
