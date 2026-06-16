package htms.QROrder.audit.repository;

import htms.QROrder.audit.dto.EmailLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface EmailLogMapper {
    void sendEmailLog(@Param("emailLog") EmailLog emailLog, @Param("userId") String userId, @Param("sysPlantCd") String sysPlantCd);
}