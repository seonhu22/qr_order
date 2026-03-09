package htms.Initial.common.repository;

import htms.Initial.common.dto.CommonAuth;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface CommonAuthMapper {
    public CommonAuth getMenuButtonAuth(String menuCd, String sysPlantCd);
}
