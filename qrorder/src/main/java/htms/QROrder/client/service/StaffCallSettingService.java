package htms.QROrder.client.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.client.dto.StaffCallSettingItem;
import htms.QROrder.client.dto.StaffCallSettingRequest;
import htms.QROrder.client.repository.StaffCallSettingMapper;
import htms.QROrder.common.exception.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Collections;
import java.util.List;
import java.util.Set;

@Service
@Transactional
@RequiredArgsConstructor
public class StaffCallSettingService {
    private final StaffCallSettingMapper mapper;

    @Transactional(readOnly = true)
    public List<StaffCallSettingItem> findAll(String sysPlantCd) {
        return mapper.findAll(sysPlantCd);
    }

    public void save(StaffCallSettingRequest request, String sysPlantCd) {
        if (request == null) throw new ValidationException("저장할 직원호출 설정이 없습니다.");

        Set<String> requestCodes = new HashSet<>();
        for (StaffCallSettingItem item : safe(request.getNewItems())) {
            validate(item, null, sysPlantCd, requestCodes);
            item.setSysId(UlidCreator.getMonotonicUlid().toString());
            mapper.insert(item, sysPlantCd);
        }
        for (StaffCallSettingItem item : safe(request.getUpdateItems())) {
            requireOwned(item, sysPlantCd);
            validate(item, item.getSysId(), sysPlantCd, requestCodes);
            mapper.update(item, sysPlantCd);
        }
        for (StaffCallSettingItem item : safe(request.getDelItems())) {
            requireOwned(item, sysPlantCd);
            mapper.delete(item.getSysId(), sysPlantCd);
        }
    }

    private void validate(StaffCallSettingItem item, String excludeSysId, String sysPlantCd,
                          Set<String> requestCodes) {
        if (item == null) throw new ValidationException("유효하지 않은 직원호출 설정입니다.");
        item.setCallCd(trim(item.getCallCd()));
        item.setCallNm(trim(item.getCallNm()));
        item.setDescription(trimToNull(item.getDescription()));
        if (item.getCallCd().isEmpty() || item.getCallNm().isEmpty()) {
            throw new ValidationException("호출코드와 호출명은 필수입니다.");
        }
        if (item.getCallCd().length() > 36 || item.getCallNm().length() > 50
                || (item.getDescription() != null && item.getDescription().length() > 200)) {
            throw new ValidationException("직원호출 설정의 글자 수를 확인해주세요.");
        }
        if (!"Y".equals(item.getSingleYn()) && !"N".equals(item.getSingleYn())) {
            throw new ValidationException("선택방식은 Y 또는 N이어야 합니다.");
        }
        if (!requestCodes.add(item.getCallCd())
                || mapper.existsByCallCd(sysPlantCd, item.getCallCd(), excludeSysId)) {
            throw new ValidationException("같은 호출코드는 중복 등록할 수 없습니다.");
        }
        if (!mapper.existsCommonCode(item.getCallCd())) {
            throw new ValidationException("등록되지 않은 직원호출 공통코드입니다.");
        }
    }

    private void requireOwned(StaffCallSettingItem item, String sysPlantCd) {
        if (item == null || item.getSysId() == null || !mapper.belongsToPlant(sysPlantCd, item.getSysId())) {
            throw new ValidationException("해당 매장의 직원호출 설정이 아닙니다.");
        }
    }

    private String trim(String value) {
        return value == null ? "" : value.trim();
    }

    private String trimToNull(String value) {
        String trimmed = trim(value);
        return trimmed.isEmpty() ? null : trimmed;
    }

    private List<StaffCallSettingItem> safe(List<StaffCallSettingItem> items) {
        return items == null ? Collections.emptyList() : items;
    }
}
