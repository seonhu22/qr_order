package htms.QROrder.system.repository;

import htms.QROrder.system.domain.Message;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface MessageMapper {
    List<Message> getMessage(String searchKeyword);
    void newMessage(List<Message> newItems, String userId, String sysPlantCd);
    void updateMessage(List<Message> updateItems, String userId);
    void delMessage(List<Message> delItems, String userId);
    boolean duplicateMessage(List<Message> newItems);
    List<Message> getDuplicateData(List<Message> newItems);
    List<Message> getOldData(List<Message> updateItems);
}
