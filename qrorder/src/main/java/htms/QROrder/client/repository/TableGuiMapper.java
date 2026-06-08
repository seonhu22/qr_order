package htms.QROrder.client.repository;

import htms.QROrder.client.dto.TableGuiItem;
import htms.QROrder.client.dto.TableGuiResponse;
import htms.QROrder.client.dto.TableInfoItem;
import htms.QROrder.client.dto.TableInfoResponse;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface TableGuiMapper {
    List<TableGuiResponse> getTableGui(String sysPlantCd);
    void newTableGui(List<TableGuiItem> newItems, String userId);
    void updateTableGui(List<TableGuiItem> updateItems, String userId);
    void delTableGui(List<TableGuiItem> delItems, String userId);
    List<TableGuiItem> getOldData(List<TableGuiItem> updateItems);
}
