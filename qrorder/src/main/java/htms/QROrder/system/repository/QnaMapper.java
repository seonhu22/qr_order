package htms.QROrder.system.repository;

import htms.QROrder.system.dto.QnaRequest;
import htms.QROrder.system.dto.QnaResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface QnaMapper {
    List<QnaResponse> getQna(@Param("searchKeyword") String searchKeyword);
    int updateQna(QnaRequest qnaRequest, String userId);
    QnaResponse getOldData(QnaRequest qnaRequest);
}
