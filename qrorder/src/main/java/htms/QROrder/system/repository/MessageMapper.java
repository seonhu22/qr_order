package htms.QROrder.system.repository;

import htms.QROrder.system.domain.Message;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface MessageMapper {
    List<Message> getMessage(String searchKeyword);
    List<Message> newMessage(List<Message> newItems, String userId, String sysPlantCd);
    List<Message> updateMessage(List<Message> updateItems, String userId);
    List<Message> delMessage(List<Message> delItems, String userId);
    boolean duplicateMessage(List<Message> newItems);
    List<Message> getDeuplicateData(List<Message> newItems);
}
