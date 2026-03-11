package htms.QROrder.audit.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.audit.domain.Audit;
import htms.QROrder.audit.domain.TableInfo;
import htms.QROrder.audit.repository.AuditMapper;
import htms.QROrder.common.exception.ValidationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class AuditService {

    private final AuditMapper auditMapper;

    public List<TableInfo> getTableInfo(String tableName) {

        return auditMapper.getTableInfo(tableName);
    }

    public <T> void insertNewAuditTrailData(T newData,
                                            String refKey,
                                            String menuCd,
                                            String tableNm,
                                            String userId,
                                            String sysPlantCd) {

        Audit audit = convertNewAuditTrailData(newData, menuCd, tableNm);
        auditMapper.insertNewSingleAuditTrailData(audit, refKey, userId, sysPlantCd);
    }

    public <T> void insertNewAuditTrailData(List<T> newData,
                                            String menuCd,
                                            String tableNm,
                                            String userId,
                                            String sysPlantCd) {

        List<Audit> audit = convertNewAuditTrailData(newData, menuCd, tableNm);
        auditMapper.insertNewMultiAuditTrailData(audit, userId, sysPlantCd);
    }

    public <T> Audit convertNewAuditTrailData(T newData,
                                            String menuCd,
                                            String tableNm) {

        List<TableInfo> tableInfo = getTableInfo(tableNm);
        Map<String, String> columnCommentMap = tableInfo.stream()
                .collect(Collectors.toMap(TableInfo::getColumnName, TableInfo::getColumnComment));
        String ULID = UlidCreator.getMonotonicUlid().toString();

        Audit audit = new Audit();
        audit.setAuditSysId(ULID);
        audit.setAuditFlag("I");
        audit.setMenuCd(menuCd);
        audit.setTableNm(tableNm);
        audit.setInsertDatetime(LocalDateTime.now());

        Map<String, Object> newDataMap = dataSetToHashMap(newData);

        StringBuilder contents = new StringBuilder("신규 데이터\n");
        for (Map.Entry<String, Object> entry : newDataMap.entrySet()) {
            String snakeKey = camelToSnake(entry.getKey());
            String comment = columnCommentMap.get(snakeKey);

            if (comment == null) {
                continue;
            }

            contents.append(" ")
                    .append(comment).append(": ")
                    .append(entry.getValue() != null ? entry.getValue().toString() : "")
                    .append("\n");
        }

        audit.setAuditTrailContents(contents.toString().trim());
        return audit;
    }

    public <T> List<Audit> convertNewAuditTrailData(List<T> newData,
                                            String menuCd,
                                            String tableNm) {

        List<TableInfo> tableInfo = getTableInfo(tableNm);
        Map<String, String> columnCommentMap = tableInfo.stream()
                .collect(Collectors.toMap(TableInfo::getColumnName, TableInfo::getColumnComment));

        List<Audit> auditResult = new ArrayList<>();

        newData.forEach(newId -> {
            Map<String, Object> newDataMap = dataSetToHashMap(newId);
            String ULID = UlidCreator.getMonotonicUlid().toString();
            StringBuilder contents = new StringBuilder("신규 데이터\n");

            Audit audit = new Audit();
            audit.setAuditSysId(ULID);
            audit.setAuditFlag("I");
            audit.setMenuCd(menuCd);
            audit.setTableNm(tableNm);
            audit.setInsertDatetime(LocalDateTime.now());

            // DB 테이블 구조상, 모든 PK는 sys_id로 구성되어야함.
            Object sysIdVal = newDataMap.get("sysId");
            if(sysIdVal == null) {
                throw new ValidationException("AT 에러. 관리자에게 문의 바랍니다.");
            }
            else {
                audit.setRefKey(sysIdVal.toString());
            }

            for (Map.Entry<String, Object> entry : newDataMap.entrySet()) {
                String snakeKey = camelToSnake(entry.getKey());
                String comment = columnCommentMap.get(snakeKey);

                if (comment == null) {
                    continue;
                }

                contents.append(" ")
                        .append(comment).append(": ")
                        .append(entry.getValue() != null ? entry.getValue().toString() : "")
                        .append("\n");
            }

            audit.setAuditTrailContents(contents.toString().trim());
            auditResult.add(audit);
        });

        return auditResult;
    }

    public <T> void insertUpdateAuditTrailData(T oldData,
                                        T newData,
                                        String refKey,
                                        String menuCd,
                                        String tableNm,
                                        String userId,
                                        String sysPlantCd) {

        Audit audit = convertUpdateAuditTrailData(oldData, newData, menuCd, tableNm);
        auditMapper.insertUpdateSingleAuditTrailData(audit, refKey, userId, sysPlantCd);
    }

    public <T> void insertUpdateAuditTrailData(List<T> oldData,
                                                List<T> newData,
                                                String menuCd,
                                                String tableNm,
                                                String userId,
                                                String sysPlantCd) {

        List<Audit> audit = convertUpdateAuditTrailData(oldData, newData, menuCd, tableNm);
        auditMapper.insertUpdateMultiAuditTrailData(audit, userId, sysPlantCd);
    }

    public <T> Audit convertUpdateAuditTrailData(T oldData,
                                                    T newData,
                                                    String menuCd,
                                                    String tableNm) {

        List<TableInfo> tableInfo = getTableInfo(tableNm);
        Map<String, String> columnCommentMap = tableInfo.stream()
                .collect(Collectors.toMap(TableInfo::getColumnName, TableInfo::getColumnComment));
        String ULID = UlidCreator.getMonotonicUlid().toString();

        Audit audit = new Audit();
        audit.setAuditSysId(ULID);
        audit.setAuditFlag("U");
        audit.setMenuCd(menuCd);
        audit.setTableNm(tableNm);
        audit.setInsertDatetime(LocalDateTime.now());

        Map<String, Object> oldDataMap = dataSetToHashMap(oldData);
        Map<String, Object> newDataMap = dataSetToHashMap(newData);

        StringBuilder contents = new StringBuilder("수정 데이터\n");

        for (Map.Entry<String, Object> oldEntry : oldDataMap.entrySet()) {
            String key = oldEntry.getKey();
            Object oldVal = oldEntry.getValue();
            Object newVal = newDataMap.get(key);

            if (!Objects.equals(oldVal, newVal)) {
                String snakeKey = camelToSnake(key);
                String comment = columnCommentMap.get(snakeKey);

                if (comment == null) {
                    continue;
                }

                contents.append(" ")
                    .append(comment).append(": ")
                    .append(oldVal != null ? oldVal.toString() : "")
                    .append(" -> ")
                    .append(newVal != null ? newVal.toString() : "")
                    .append("\n");
            }
        }

        audit.setAuditTrailContents(contents.toString().trim());
        return audit;
    }

    public <T> List<Audit> convertUpdateAuditTrailData(List<T> oldData,
                                            List<T> newData,
                                            String menuCd,
                                            String tableNm) {

        List<TableInfo> tableInfo = getTableInfo(tableNm);
        Map<String, String> columnCommentMap = tableInfo.stream()
                .collect(Collectors.toMap(TableInfo::getColumnName, TableInfo::getColumnComment));
        List<Audit> auditResult = new ArrayList<>();

        Map<String, Map<String, Object>> newDataBySysId = new HashMap<>();
        newData.forEach(newItem -> {
            Map<String, Object> newDataMap = dataSetToHashMap(newItem);
            Object sysIdVal = newDataMap.get("sysId");
            if (sysIdVal != null) {
                newDataBySysId.put(sysIdVal.toString(), newDataMap);
            }
        });

        oldData.forEach(old -> {
            Map<String, Object> oldDataMap = dataSetToHashMap(old);
            Object sysIdVal = oldDataMap.get("sysId");
            if (sysIdVal == null) return;

            String sysId = sysIdVal.toString();
            Map<String, Object> newDataMap = newDataBySysId.get(sysId);
            if (newDataMap == null) return;

            StringBuilder contents = new StringBuilder("수정 데이터\n");

            for (Map.Entry<String, Object> oldEntry : oldDataMap.entrySet()) {
                String key = oldEntry.getKey();
                Object oldVal = oldEntry.getValue();
                Object newVal = newDataMap.get(key);

                if (!Objects.equals(oldVal, newVal)) {
                    String snakeKey = camelToSnake(key);
                    String comment = columnCommentMap.get(snakeKey);
                    if (comment == null) {
                        continue;
                    }

                    contents.append(" ")
                        .append(comment).append(": ")
                        .append(oldVal != null ? oldVal.toString() : "")
                        .append(" -> ")
                        .append(newVal != null ? newVal.toString() : "")
                        .append("\n");
                }
            }

            String ULID = UlidCreator.getMonotonicUlid().toString();
            Audit audit = new Audit();
            audit.setAuditSysId(ULID);
            audit.setAuditFlag("U");
            audit.setRefKey(sysId);
            audit.setMenuCd(menuCd);
            audit.setTableNm(tableNm);
            audit.setInsertDatetime(LocalDateTime.now());
            audit.setAuditTrailContents(contents.toString().trim());
            auditResult.add(audit);
        });

        return auditResult;
    }

    public <T> void insertDeleteAuditTrailData(List<T> delIds,
                                        String menuCd,
                                        String tableNm,
                                        String userId,
                                        String sysPlantCd) {

        List<Audit> audit = convertDeleteAuditTrailData(delIds, menuCd, tableNm);
        auditMapper.insertDeleteAuditTrailData(audit, userId, sysPlantCd);
    }

    public <T> List<Audit> convertDeleteAuditTrailData(List<T> delIds,
                                            String menuCd,
                                            String tableNm) {

        List<TableInfo> tableInfo = getTableInfo(tableNm);
        Map<String, String> columnCommentMap = tableInfo.stream()
                .collect(Collectors.toMap(TableInfo::getColumnName, TableInfo::getColumnComment));

        List<Audit> auditResult = new ArrayList<>();

        delIds.forEach(delId -> {
            Map<String, Object> delDataMap = dataSetToHashMap(delId);
            String ULID = UlidCreator.getMonotonicUlid().toString();
            StringBuilder contents = new StringBuilder("삭제 데이터\n");

            Audit audit = new Audit();
            audit.setAuditSysId(ULID);
            audit.setAuditFlag("D");
            audit.setMenuCd(menuCd);
            audit.setTableNm(tableNm);
            audit.setInsertDatetime(LocalDateTime.now());

            // DB 테이블 구조상, 모든 PK는 sys_id로 구성되어야함.
            Object sysIdVal = delDataMap.get("sysId");
            if(sysIdVal == null) {
                throw new ValidationException("AT 에러. 관리자에게 문의 바랍니다.");
            }
            else {
                audit.setRefKey(sysIdVal.toString());
            }

            for (Map.Entry<String, Object> entry : delDataMap.entrySet()) {
                String snakeKey = camelToSnake(entry.getKey());
                String comment = columnCommentMap.get(snakeKey);

                if (comment == null) {
                    continue;
                }

                contents.append(" ")
                        .append(comment).append(": ")
                        .append(entry.getValue() != null ? entry.getValue().toString() : "")
                        .append("\n");
            }

            audit.setAuditTrailContents(contents.toString().trim());
            auditResult.add(audit);
        });

        return auditResult;
    }

    private <T> Map<String, Object> dataSetToHashMap(T dataSet) {
        Map<String, Object> hashMap = new HashMap<>();

        Arrays.stream(dataSet.getClass().getDeclaredFields()).forEach(field -> {
            try {
                field.setAccessible(true);
                hashMap.put(field.getName(), field.get(dataSet));
            } catch (IllegalAccessException e) {
                throw new RuntimeException(e);
            }
        });

        return hashMap;
    }

    private String camelToSnake(String camel) {
        return camel.replaceAll("([A-Z])", "_$1").toLowerCase();
    }
}
