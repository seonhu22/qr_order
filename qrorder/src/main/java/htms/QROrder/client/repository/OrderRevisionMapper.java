package htms.QROrder.client.repository;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface OrderRevisionMapper {
    OrderRevisionRows.Revision findRevision(String sysPlantCd, String clientRequestId);
    List<OrderRevisionRows.Target> findTargets(String sysPlantCd, List<String> orderGroupIds);
    int reserveRevision(@Param("revisionId") String revisionId,
                        @Param("sysPlantCd") String sysPlantCd,
                        @Param("clientRequestId") String clientRequestId,
                        @Param("orderMasterId") String orderMasterId,
                        @Param("tableSysId") String tableSysId,
                        @Param("fingerprint") String fingerprint,
                        @Param("userId") String userId);
    String lockTable(String sysPlantCd, String tableSysId);
    String lockOrderMaster(String sysPlantCd, String orderMasterId, String tableSysId);
    List<OrderRevisionRows.Target> lockOrderGroups(String sysPlantCd, List<String> orderGroupIds);
    List<String> lockOrderDetails(String sysPlantCd, String orderMasterId,
                                  List<String> orderGroupIds, List<String> detailIds);
    int insertRemovedDetails(String revisionId, List<String> detailIds, LocalDateTime removedAt);
    List<String> findEmptyOrderGroups(String sysPlantCd, List<String> orderGroupIds);
    int cancelEmptyOrderGroups(String sysPlantCd, List<String> orderGroupIds,
                               String userId, LocalDateTime cancelledAt);
    int lockOrderNumberScope(String sysPlantCd);
    int findNextOrderNumber(String sysPlantCd);
    int insertOrderGroup(OrderRevisionRows.Group group);
    int insertOrderDetail(OrderRevisionRows.Item item);
    int insertOrderDetailOption(OrderRevisionRows.Option option);
    int completeRevision(String revisionId, String responseJson, LocalDateTime completedAt);
}
