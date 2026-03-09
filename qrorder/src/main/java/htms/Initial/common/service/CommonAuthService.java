package htms.Initial.common.service;

import htms.Initial.common.dto.CommonAuth;
import htms.Initial.common.repository.CommonAuthMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class CommonAuthService {
    private final CommonAuthMapper commonAuthMapper;

    public CommonAuth getMenuButtonAuth(String menuCd, String sysPlantCd) {

        return commonAuthMapper.getMenuButtonAuth(menuCd, sysPlantCd);
    }
}
