package htms.QROrder.audit.repository;

import htms.QROrder.audit.domain.ErrorInfo;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ErrorMapper {
    void newErrorInfo(ErrorInfo errorInfo);
}
