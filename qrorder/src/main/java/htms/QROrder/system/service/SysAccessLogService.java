package htms.QROrder.system.service;

import htms.QROrder.system.domain.SysAccessLogDetail;
import htms.QROrder.system.domain.SysAccessLogMaster;
import htms.QROrder.system.repository.SysAccessLogMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class SysAccessLogService {

    private final SysAccessLogMapper sysAccessLogMapper;

    public List<SysAccessLogMaster> getSysAccessLogMaster(String searchKeyword,
                                                            Date startDate,
                                                            Date endDate) {

        return sysAccessLogMapper.getSysAccessLogMaster(searchKeyword, startDate, endDate);
    }

    public List<SysAccessLogDetail> getSysAccessLogDetail(String sysId) {

        return sysAccessLogMapper.getSysAccessLogDetail(sysId);
    }
}
