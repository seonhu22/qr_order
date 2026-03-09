package htms.Initial.audit.repository;

import htms.Initial.audit.domain.Audit;
import htms.Initial.audit.domain.TableInfo;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface AuditMapper {
    public List<TableInfo> getTableInfo(String tableName);
    void insertNewSingleAuditTrailData(Audit audit, String refKey, String userId, String sysPlantCd);
    void insertNewMultiAuditTrailData(List<Audit> audit, String userId, String sysPlantCd);
    void insertUpdateSingleAuditTrailData(Audit audit, String refKey, String userId, String sysPlantCd);
    void insertUpdateMultiAuditTrailData(List<Audit> audit, String userId, String sysPlantCd);
    void insertDeleteAuditTrailData(List<Audit> audit, String userId, String sysPlantCd);
}
