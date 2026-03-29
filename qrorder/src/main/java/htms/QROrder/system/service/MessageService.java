package htms.QROrder.system.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.audit.service.AuditService;
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
    private final AuditService auditService;

    public List<Message> getMessage(String searchKeyword) {

        return messageMapper.getMessage(searchKeyword);
    }

    public void saveMessage(MessageRequest messageRequest,
                                String userId,
                                String sysPlantCd,
                                String menuCd) {

        List<Message> newItems = messageRequest.getNewItems();
        List<Message> updateItems = messageRequest.getUpdateItems();
        List<Message> delItems = messageRequest.getDelItems();

        if(!newItems.isEmpty()){
            if(duplicateMessage(newItems)){

                List<Message> deuplicateData = getDuplicateData(newItems);

                String result = deuplicateData.stream()
                    .map(u -> u.getMsgNm() + "(" + u.getMsgCd() + ")")
                    .collect(Collectors.joining(", "));

                throw new DuplicateException("중복된 메시지가 존재합니다.\n" + result);
            }

            newItems.forEach(item -> {
                item.setSysId(UlidCreator.getUlid().toString());
            });

            newMessage(userId, sysPlantCd, newItems, menuCd);
        }

        if(!updateItems.isEmpty()){
            updateMessage(userId, sysPlantCd, updateItems, menuCd);
        }

        if(!delItems.isEmpty()){
            delMessage(userId, delItems, sysPlantCd, menuCd);
        }
    }

    private void delMessage(String userId,
                                List<Message> delItems,
                                String sysPlantCd,
                                String menuCd) {

        auditService.insertDeleteAuditTrailData(delItems, menuCd, "sys_message", userId, sysPlantCd);
        messageMapper.delMessage(delItems, userId);
    }

    private void updateMessage(String userId,
                                String sysPlantCd,
                                List<Message> updateItems,
                                String menuCd) {

        List<Message> oldData = getOldData(updateItems);

        auditService.insertUpdateAuditTrailData(oldData, updateItems, menuCd, "sys_message", userId, sysPlantCd);
        messageMapper.updateMessage(updateItems, userId);
    }

    private void newMessage(String userId,
                                String sysPlantCd,
                                List<Message> newItems,
                                String menuCd) {

        auditService.insertNewAuditTrailData(newItems, menuCd, "sys_message", userId, sysPlantCd);
        messageMapper.newMessage(newItems, userId, sysPlantCd);
    }

    private boolean duplicateMessage(List<Message> newItems) {

        return messageMapper.duplicateMessage(newItems);
    }

    private List<Message> getDuplicateData(List<Message> newItems) {

        return messageMapper.getDuplicateData(newItems);
    }

    private List<Message> getOldData(List<Message> updateItems) {

        return messageMapper.getOldData(updateItems);
    }
}
