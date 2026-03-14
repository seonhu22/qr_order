package htms.QROrder.system.service;

import htms.QROrder.system.domain.Menu;
import htms.QROrder.system.repository.MenuMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class MenuService {

    private final MenuMapper menuMapper;

    public List<Menu> getMenu() {

        return menuMapper.getMenu();
    }

    public void saveMenu(List<Menu> menu,
                            String userId,
                            String sysPlantCd) {

        menuMapper.saveMenu(menu,userId,sysPlantCd);
    }
}
