package htms.QROrder.consumer.menu.service;

import htms.QROrder.consumer.menu.dto.ConsumerMenuCategoryItem;
import htms.QROrder.consumer.menu.dto.ConsumerMenuItem;
import htms.QROrder.consumer.menu.dto.ConsumerMenuMainBody;
import htms.QROrder.consumer.menu.dto.ConsumerMenuMainHeader;
import htms.QROrder.consumer.menu.dto.ConsumerMenuMainResponse;
import htms.QROrder.consumer.menu.dto.ConsumerMenuSearchResponse;
import htms.QROrder.consumer.menu.repository.ConsumerMenuMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ConsumerMenuService {

    private final ConsumerMenuMapper consumerMenuMapper;

    public ConsumerMenuMainResponse getMain(String sysPlantCd, Integer tableNum) {
        String storeName = consumerMenuMapper.getStoreName(sysPlantCd);

        if (storeName == null) {
            return null;
        }

        List<ConsumerMenuCategoryItem> categoryList = consumerMenuMapper.getCategoryList(sysPlantCd);
        List<ConsumerMenuItem> menuList = consumerMenuMapper.getMenuList(sysPlantCd);

        return new ConsumerMenuMainResponse(
                storeName,
                tableNum,
                new ConsumerMenuMainHeader(categoryList),
                new ConsumerMenuMainBody(menuList)
        );
    }

    public ConsumerMenuSearchResponse search(
            String sysPlantCd,
            String searchKeyword,
            String categorySysId) {
        String storeName = consumerMenuMapper.getStoreName(sysPlantCd);

        if (storeName == null) {
            return null;
        }

        String normalizedSearchKeyword = normalizeOptional(searchKeyword);
        String normalizedCategorySysId = normalizeOptional(categorySysId);
        List<ConsumerMenuItem> menuList = consumerMenuMapper.searchMenuList(
                sysPlantCd,
                normalizedSearchKeyword,
                normalizedCategorySysId
        );

        return new ConsumerMenuSearchResponse(new ConsumerMenuMainBody(menuList));
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }

        String normalizedValue = value.strip();
        return normalizedValue.isEmpty() ? null : normalizedValue;
    }
}
