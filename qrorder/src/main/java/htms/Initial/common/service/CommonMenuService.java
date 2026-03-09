package htms.Initial.common.service;

import htms.Initial.common.dto.CommonMenu;
import htms.Initial.common.repository.CommonMenuMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class CommonMenuService {

    private final CommonMenuMapper commonMenuMapper;

    public List<CommonMenu> getMenuLevel1Depth(Long sysId,
                                                Integer menuLevel,
                                                String userId,
                                                String sysPlantCd) {

        if(getAdminYn(userId)) {
            return commonMenuMapper.getAdminMenuLevel1Depth(sysId, menuLevel, userId, sysPlantCd);
        }
        else {
            return commonMenuMapper.getUserMenuLevel1Depth(sysId, menuLevel, userId, sysPlantCd);
        }
    }

    public List<CommonMenu> getMenuLevel2Depth(String menuCd,
                                            Integer menuLevel,
                                            String userId,
                                            String sysPlantCd) {

        if(getAdminYn(userId)) {
            return commonMenuMapper.getAdminMenuLevel2Depth(menuCd, menuLevel, userId, sysPlantCd);
        }
        else {
            return commonMenuMapper.getUserMenuLevel2Depth(menuCd, menuLevel, userId, sysPlantCd);
        }
    }

    public List<CommonMenu> getMenuLevel3Depth(String menuCd,
                                                Integer menuLevel,
                                                String userId,
                                                String sysPlantCd) {

        if(getAdminYn(userId)) {
            return commonMenuMapper.getAdminMenuLevel3Depth(menuCd, menuLevel, userId, sysPlantCd);
        }
        else {
            return commonMenuMapper.getUserMenuLevel3Depth(menuCd, menuLevel, userId, sysPlantCd);
        }
    }

    public boolean getAdminYn(String userId) {

        return commonMenuMapper.getAdminYn(userId);
    }
}
