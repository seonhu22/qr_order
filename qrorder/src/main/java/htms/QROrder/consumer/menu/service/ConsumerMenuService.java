package htms.QROrder.consumer.menu.service;

import htms.QROrder.consumer.menu.dto.ConsumerMenuCategoryItem;
import htms.QROrder.consumer.menu.dto.ConsumerMenuDetailBody;
import htms.QROrder.consumer.menu.dto.ConsumerMenuDetailResponse;
import htms.QROrder.consumer.menu.dto.ConsumerMenuItem;
import htms.QROrder.consumer.menu.dto.ConsumerMenuMainBody;
import htms.QROrder.consumer.menu.dto.ConsumerMenuMainHeader;
import htms.QROrder.consumer.menu.dto.ConsumerMenuMainResponse;
import htms.QROrder.consumer.menu.dto.ConsumerMenuOptionGroup;
import htms.QROrder.consumer.menu.dto.ConsumerMenuOptionItem;
import htms.QROrder.consumer.menu.dto.ConsumerMenuOptionRow;
import htms.QROrder.consumer.menu.dto.ConsumerMenuSearchResponse;
import htms.QROrder.consumer.menu.repository.ConsumerMenuMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ConsumerMenuService {

    private static final Set<String> OPTION_SELECTION_TYPES = Set.of("01", "02", "03");

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

    public boolean isStoreAvailable(String sysPlantCd) {
        return consumerMenuMapper.getStoreName(sysPlantCd) != null;
    }

    public ConsumerMenuDetailResponse getDetail(String sysPlantCd, String menuSysId) {
        ConsumerMenuItem menu = consumerMenuMapper.getMenuDetail(sysPlantCd, menuSysId);

        if (menu == null) {
            return null;
        }

        List<ConsumerMenuOptionGroup> optionGroupList = "Y".equals(menu.getOptionUseYn())
                ? assembleOptionGroups(consumerMenuMapper.getMenuOptionRows(sysPlantCd, menuSysId))
                : List.of();

        return new ConsumerMenuDetailResponse(ConsumerMenuDetailBody.from(menu, optionGroupList));
    }

    private List<ConsumerMenuOptionGroup> assembleOptionGroups(List<ConsumerMenuOptionRow> optionRows) {
        Map<String, ConsumerMenuOptionGroup> groupById = new LinkedHashMap<>();

        for (ConsumerMenuOptionRow row : optionRows) {
            validateOptionRow(row);

            ConsumerMenuOptionGroup group = groupById.computeIfAbsent(
                    row.getOptionGroupSysId(),
                    groupSysId -> new ConsumerMenuOptionGroup(
                            groupSysId,
                            row.getGroupName(),
                            row.getRequiredYn(),
                            row.getSelectionType(),
                            new ArrayList<>()
                    )
            );

            group.getOptionList().add(new ConsumerMenuOptionItem(
                    row.getMenuOptionSysId(),
                    row.getMenuOptionName(),
                    row.getMenuOptionPrice(),
                    row.getMenuOptionDescription(),
                    row.getMaximumNum(),
                    row.getDefaultYn()
            ));
        }

        return new ArrayList<>(groupById.values());
    }

    private void validateOptionRow(ConsumerMenuOptionRow row) {
        if (!OPTION_SELECTION_TYPES.contains(row.getSelectionType())) {
            throw new IllegalStateException(
                    "정의되지 않은 옵션 선택 코드입니다: " + row.getSelectionType()
            );
        }

        if (row.getMaximumNum() == null) {
            throw new IllegalStateException("옵션 최대 수량이 누락되었습니다.");
        }
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }

        String normalizedValue = value.strip();
        return normalizedValue.isEmpty() ? null : normalizedValue;
    }
}
