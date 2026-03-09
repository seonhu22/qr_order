package htms.Initial.common.repository;

import htms.Initial.common.dto.CommonMenu;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface CommonMenuMapper {
    public List<CommonMenu> getAdminMenuLevel1Depth(Long sysId, Integer menuLevel, String userId, String sysPlantCd);
    public List<CommonMenu> getAdminMenuLevel2Depth(String menuCd, Integer menuLevel, String userId, String sysPlantCd);
    public List<CommonMenu> getAdminMenuLevel3Depth(String menuCd, Integer menuLevel, String userId, String sysPlantCd);
    public List<CommonMenu> getUserMenuLevel1Depth(Long sysId, Integer menuLevel, String userId, String sysPlantCd);
    public List<CommonMenu> getUserMenuLevel2Depth(String menuCd, Integer menuLevel, String userId, String sysPlantCd);
    public List<CommonMenu> getUserMenuLevel3Depth(String menuCd, Integer menuLevel, String userId, String sysPlantCd);
    public boolean getAdminYn(String userId);
}
