package htms.QROrder.system.repository;

import htms.QROrder.system.dto.NoticeRequest;
import htms.QROrder.system.dto.NoticeResponse;
import htms.QROrder.system.dto.QnaRequest;
import htms.QROrder.system.dto.QnaResponse;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface QnaMapper {
    List<QnaResponse> getQna(String searchKeyword, String sysPlantCd);
    void updateQna(QnaRequest qnaRequest, String userId, String sysPlantCd);
    QnaResponse getOldData(QnaRequest qnaRequest);
}
