package htms.QROrder.client.repository;

import htms.QROrder.client.dto.TableInfoItem;
import htms.QROrder.client.dto.TableInfoResponse;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface TableInfoMapper {
    List<TableInfoResponse> getTableInfo(String sysPlantCd);
    void newTableInfo(List<TableInfoItem> newItems, String userId, String sysPlantCd, String menuCd);
    void updateTableInfo(List<TableInfoItem> updateItems, String userId, String sysPlantCd, String menuCd);
    void delTableInfo(List<TableInfoItem> delItems, String userId, String sysPlantCd, String menuCd);
    List<TableInfoItem> getDuplicateData(List<TableInfoItem> tableInfoItem);
    List<TableInfoItem> getOldData(List<TableInfoItem> tableInfoItem);
    boolean duplicateChk(List<TableInfoItem> newItems);
}
