package htms.QROrder.audit.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.audit.domain.ErrorInfo;
import htms.QROrder.audit.repository.ErrorMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Arrays;

@Slf4j
@Service
@RequiredArgsConstructor
public class ErrorService {

    private static final String BASE_PACKAGE = "htms.QROrder";

    private final ErrorMapper errorMapper;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveErrorInfo(RuntimeException e, String menuCd, String userId, String sysPlantCd) {
        StackTraceElement frame = Arrays.stream(e.getStackTrace())
                .filter(f -> f.getClassName().startsWith(BASE_PACKAGE))
                .findFirst()
                .orElse(e.getStackTrace()[0]);

        StringWriter sw = new StringWriter();
        e.printStackTrace(new PrintWriter(sw));

        ErrorInfo errorInfo = new ErrorInfo();
        errorInfo.setSysId(UlidCreator.getUlid().toString());
        errorInfo.setErrMsg(e.getMessage());
        errorInfo.setErrDetailMsg(sw.toString());
        errorInfo.setMenuCd(menuCd != null ? menuCd : "UNKNOWN");
        errorInfo.setFilePath(frame.getFileName());
        errorInfo.setFunctionNm(frame.getMethodName());
        errorInfo.setInsertUserId(userId != null ? userId : "UNKNOWN");
        errorInfo.setSysPlantCd(sysPlantCd);

        errorMapper.newErrorInfo(errorInfo);
    }
}
