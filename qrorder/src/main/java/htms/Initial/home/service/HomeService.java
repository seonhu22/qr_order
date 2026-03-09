package htms.Initial.home.service;

import htms.Initial.auth.exception.LoginFailException;
import htms.Initial.home.repository.HomeMapper;
import htms.Initial.system.domain.Plant;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class HomeService {
    private final HomeMapper homeMapper;

    public boolean chkDomainExist(String domainUrl) {

        if(homeMapper.chkDomainExist(domainUrl)) {
            return true;
        }
        else {
            return false;
        }
    }

    public Plant getPlant(String domainUrl) {

        return homeMapper.getPlant(domainUrl);
    }
}
