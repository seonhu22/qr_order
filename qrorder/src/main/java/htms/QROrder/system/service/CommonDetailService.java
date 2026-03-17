package htms.QROrder.system.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.audit.service.AuditService;
import htms.QROrder.common.exception.DuplicateException;
import htms.QROrder.system.domain.CommonDetail;
import htms.QROrder.system.dto.AdminUserResponse;
import htms.QROrder.system.dto.CommonDetailRequest;
import htms.QROrder.system.repository.CommonDetailMapper;
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
public class CommonDetailService {
    private final CommonDetailMapper commonDetailMapper;
    private final AuditService auditService;

    public List<CommonDetail> findCommonDetailBySearchCond(String linkSysId,
                                                            String searchCond) {

        return commonDetailMapper.findCommonDetailBySearchCond(linkSysId , searchCond);
    }

    public void newCommonDetail(List<CommonDetail> commonDetail,
                                String userId,
                                String sysPlantCd,
                                String menuCd) {

        commonDetail.forEach(item -> item.setSysId(UlidCreator.getMonotonicUlid().toString()));
        auditService.insertNewAuditTrailData(commonDetail, menuCd, "sys_common_detail", userId, sysPlantCd);
        commonDetailMapper.newCommonDetail(commonDetail, userId);
    }

    public void delCommonDetail(List<CommonDetail> commonDetail,
                                String userId,
                                String sysPlantCd,
                                String menuCd) {

        List<String> ids = commonDetail.stream().map(CommonDetail::getSysId).collect(Collectors.toList());

        auditService.insertDeleteAuditTrailData(commonDetail, menuCd, "sys_common_detail", userId, sysPlantCd);
        commonDetailMapper.delCommonDetail(ids, userId);
    }

    public void updateCommonDetail(List<CommonDetail> commonDetail,
                                    String userId,
                                String sysPlantCd,
                                String menuCd) {

        List<CommonDetail> oldData = commonDetailMapper.getOldData(commonDetail);
        auditService.insertUpdateAuditTrailData(oldData, commonDetail, menuCd, "sys_common_detail", userId, sysPlantCd);
        commonDetailMapper.updateCommonDetail(commonDetail, userId);
    }

    public boolean duplicateChk(List<CommonDetail> commonDetail) {

        return  commonDetailMapper.duplicateChk(commonDetail);
    }

    public List<CommonDetail> getDeuplicateData(List<CommonDetail> commonDetail) {

        return commonDetailMapper.getDeuplicateData(commonDetail);
    }

    public void saveCommonDetail(CommonDetailRequest requestData,
                                    String userId,
                                    String sysPlantId,
                                    String menuCd) {

        List<CommonDetail> newItems = requestData.getNewItems();
        List<CommonDetail> updateItems = requestData.getUpdateItems();
        List<CommonDetail> delItems = requestData.getDeleteItems();

        if(!newItems.isEmpty()) {
            if(duplicateChk(newItems)) {
                List<CommonDetail> deuplicateAdminUser = getDeuplicateData(newItems);

                String result = deuplicateAdminUser.stream()
                    .map(u -> u.getCommonNm() + "(" + u.getCommonCd() + ")")
                    .collect(Collectors.joining(", "));

                throw new DuplicateException("중복된 사용자가 존재합니다.\n" + result);
            }

            newCommonDetail(newItems, userId, sysPlantId, menuCd);
        }

        if(!updateItems.isEmpty()) {

            updateCommonDetail(updateItems, userId, sysPlantId, menuCd);
        }

        if(!delItems.isEmpty()) {

            delCommonDetail(delItems, userId, sysPlantId, menuCd);
        }
    }
}
