package htms.QROrder.client.repository;

import htms.QROrder.client.dto.ClientQnaItem;
import htms.QROrder.client.dto.ClientQnaRequest;
import htms.QROrder.client.dto.ClientQnaResponse;
import htms.QROrder.common.dto.AttachScope;
import htms.QROrder.common.dto.FileInfo;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface ClientQnaMapper {
    List<ClientQnaResponse> getQna(String searchKeyword, String sysPlantCd);
    void newQna(ClientQnaRequest qnaRequest, String userId, String sysPlantCd);
    int updateQna(ClientQnaRequest qnaRequest, String userId, String sysPlantCd);
    ClientQnaItem delQna(ClientQnaRequest qnaRequest, String userId, String sysPlantCd);
    List<FileInfo> getActiveAttachmentIds(AttachScope scope);
}
