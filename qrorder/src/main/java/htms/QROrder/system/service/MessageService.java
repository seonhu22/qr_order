package htms.QROrder.system.service;

import htms.QROrder.common.exception.DuplicateException;
import htms.QROrder.system.domain.Message;
import htms.QROrder.system.dto.AdminUserResponse;
import htms.QROrder.system.dto.MessageRequest;
import htms.QROrder.system.repository.MessageMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class MessageService {

    private final MessageMapper messageMapper;

    public List<Message> getMessage(String searchKeyword) {

        return messageMapper.getMessage(searchKeyword);
    }

    public void saveMessage(MessageRequest messageRequest,
                                String userId,
                                String sysPlantCd) {

        List<Message> newItems = messageRequest.getNewItems();
        List<Message> updateItems = messageRequest.getUpdateItems();
        List<Message> delItems = messageRequest.getDelItems();

        if(duplicateMessage(newItems)){

            List<Message> deuplicateData = getDeuplicateData(newItems);

            String result = deuplicateData.stream()
                .map(u -> u.getMsgNm() + "(" + u.getMsgCd() + ")")
                .collect(Collectors.joining(", "));

            throw new DuplicateException("중복된 메시지가 존재합니다.\n" + result);
        }

        if(!newItems.isEmpty()){
            messageMapper.newMessage(newItems, userId, sysPlantCd);
        }
        if(!updateItems.isEmpty()){
            messageMapper.updateMessage(updateItems, userId);
        }
        if(!delItems.isEmpty()){
            messageMapper.delMessage(delItems, userId);
        }
    }

    public boolean duplicateMessage(List<Message> newItems) {

        return messageMapper.duplicateMessage(newItems);
    }

    public List<Message> getDeuplicateData(List<Message> newItems) {

        return messageMapper.getDeuplicateData(newItems);
    }
}
