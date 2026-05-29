package htms.QROrder.client.repository;

import htms.QROrder.client.dto.NoticeResponse;
import htms.QROrder.client.dto.QnaRequest;
import htms.QROrder.client.dto.QnaResponse;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface QnaMapper {
    List<QnaResponse> getQna(String searchKeyword, String sysPlantCd);
    void newQna(QnaRequest qnaRequest, String userId, String sysPlantCd);
    void updateQna(QnaRequest qnaRequest, String userId, String sysPlantCd);
    void delQna(QnaRequest qnaRequest, String userId, String sysPlantCd);
    QnaResponse getOldData(String sysId);
}
