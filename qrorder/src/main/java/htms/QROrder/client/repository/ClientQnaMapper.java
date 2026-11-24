package htms.QROrder.client.repository;

import htms.QROrder.client.dto.ClientQnaRequest;
import htms.QROrder.client.dto.ClientQnaResponse;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface ClientQnaMapper {
    List<ClientQnaResponse> getQna(String searchKeyword, String sysPlantCd);
    void newQna(ClientQnaRequest qnaRequest, String userId, String sysPlantCd);
    int updateQna(ClientQnaRequest qnaRequest, String userId, String sysPlantCd);
    int delQna(ClientQnaRequest qnaRequest, String userId, String sysPlantCd);
}
