package htms.Initial.common.repository;

import htms.Initial.common.dto.*;
import org.apache.ibatis.annotations.Mapper;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@Mapper
public interface CommonDataMapper {
    public List<CommonDept> getDepts(String searchKeyCond, String sysPlantCd);
    public List<CommonUsers> getUsers(String searchKeyCond, String deptCd, String sysPlantCd);
    public List<CommonPlant> getPlants(String searchKeyCond, String sysPlantCd);
    public List<CommonDeptUser> getDeptUsers(String searchKeyCond, String sysPlantCd);
    public CommonEmail getEmail(String sysPlantCd);
}
