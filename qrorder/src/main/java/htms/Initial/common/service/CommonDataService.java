package htms.Initial.common.service;

import htms.Initial.common.dto.*;
import htms.Initial.common.repository.CommonDataMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class CommonDataService {

    private final CommonDataMapper commonDataMapper;

    public List<CommonDept> getDepts(String searchKeyCond, String sysPlantCd) {

        return commonDataMapper.getDepts(searchKeyCond, sysPlantCd);
    }

    public List<CommonUsers> getUsers(String searchKeyCond, String deptCd, String sysPlantCd) {

        return commonDataMapper.getUsers(searchKeyCond, deptCd, sysPlantCd);
    }

    public List<CommonPlant> getPlants(String searchKeyCond, String sysPlantCd) {

        return commonDataMapper.getPlants(searchKeyCond, sysPlantCd);
    }

    public List<CommonDeptUser> getDeptUsers(String searchKeyCond, String sysPlantCd) {

        return commonDataMapper.getDeptUsers(searchKeyCond, sysPlantCd);
    }

    public CommonEmail getEmail(String sysPlantCd) {

        return commonDataMapper.getEmail(sysPlantCd);
    }
}
