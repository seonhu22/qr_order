package htms.QROrder.consumer.session.repository;

import htms.QROrder.consumer.session.dto.ConsumerVisitRecord;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ConsumerVisitMapper {
    String lockAvailableTable(String tableSysId, String sysPlantCd);

    ConsumerVisitRecord findActiveConsumerVisit(String tableSysId, String sysPlantCd);

    ConsumerVisitRecord findConsumerVisit(String consumerSessionId,
                                           String tableSysId,
                                           String sysPlantCd);

    String lockConsumerVisit(String consumerSessionId,
                             String tableSysId,
                             String sysPlantCd);

    String findStoreName(String sysPlantCd);

    void insertConsumerVisit(String consumerSessionId, String tableSysId, String sysPlantCd);

    int deleteExpiredEmptyConsumerVisit(String consumerSessionId,
                                        String tableSysId,
                                        String sysPlantCd);

    int touchActiveConsumerVisit(String consumerSessionId,
                                 String tableSysId,
                                 String sysPlantCd);
}
