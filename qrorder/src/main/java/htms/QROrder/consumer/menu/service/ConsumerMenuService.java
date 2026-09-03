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
import htms.QROrder.common.exception.ValidationException;
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
    private static final int MAX_SEARCH_KEYWORD_LENGTH = 100;
    private static final int MAX_IDENTIFIER_LENGTH = 64;

    private final ConsumerMenuMapper consumerMenuMapper;

    public ConsumerMenuMainResponse getMain(String sysPlantCd, Integer tableNum) {
        String storeName = consumerMenuMapper.getStoreName(sysPlantCd);

        if (storeName == null) {
            return null;
        }

        List<ConsumerMenuCategoryItem> categoryList = consumerMenuMapper.getCategoryList(sysPlantCd);
        List<ConsumerMenuItem> menuList = consumerMenuMapper.searchMenuList(sysPlantCd, null, null);

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
        String normalizedSearchKeyword = normalizeOptional(searchKeyword);
        String normalizedCategorySysId = normalizeOptional(categorySysId);

        validateMaxLength(normalizedSearchKeyword, MAX_SEARCH_KEYWORD_LENGTH, "검색어");
        validateMaxLength(normalizedCategorySysId, MAX_IDENTIFIER_LENGTH, "카테고리 ID");

        String storeName = consumerMenuMapper.getStoreName(sysPlantCd);

        if (storeName == null) {
            return null;
        }

        String escapedSearchKeyword = escapeLikePattern(normalizedSearchKeyword);
        List<ConsumerMenuItem> menuList = consumerMenuMapper.searchMenuList(
                sysPlantCd,
                escapedSearchKeyword,
                normalizedCategorySysId
        );

        return new ConsumerMenuSearchResponse(new ConsumerMenuMainBody(menuList));
    }

    public boolean isStoreAvailable(String sysPlantCd) {
        return consumerMenuMapper.getStoreName(sysPlantCd) != null;
    }

    public ConsumerMenuDetailResponse getDetail(String sysPlantCd, String menuSysId) {
        String normalizedMenuSysId = normalizeOptional(menuSysId);
        validateMaxLength(normalizedMenuSysId, MAX_IDENTIFIER_LENGTH, "메뉴 ID");

        if (normalizedMenuSysId == null) {
            throw new ValidationException("메뉴 ID는 필수입니다.");
        }

        ConsumerMenuItem menu = consumerMenuMapper.getMenuDetail(sysPlantCd, normalizedMenuSysId);

        if (menu == null) {
            return null;
        }

        List<ConsumerMenuOptionGroup> optionGroupList = "Y".equals(menu.getOptionUseYn())
                ? assembleOptionGroups(consumerMenuMapper.getMenuOptionRows(sysPlantCd, normalizedMenuSysId))
                : List.of();

        return new ConsumerMenuDetailResponse(ConsumerMenuDetailBody.from(menu, optionGroupList));
    }

    private List<ConsumerMenuOptionGroup> assembleOptionGroups(List<ConsumerMenuOptionRow> optionRows) {
        Map<String, ConsumerMenuOptionGroup> groupById = new LinkedHashMap<>();

        for (ConsumerMenuOptionRow row : optionRows) {
            String selectionType = normalizeSelectionType(row.getSelectionType());
            int maximumNum = normalizeMaximumNum(selectionType, row.getMaximumNum());

            ConsumerMenuOptionGroup group = groupById.computeIfAbsent(
                    row.getOptionGroupSysId(),
                    groupSysId -> new ConsumerMenuOptionGroup(
                            groupSysId,
                            row.getGroupName(),
                            row.getRequiredYn(),
                            selectionType,
                            new ArrayList<>()
                    )
            );

            group.getOptionList().add(new ConsumerMenuOptionItem(
                    row.getMenuOptionSysId(),
                    row.getMenuOptionName(),
                    row.getMenuOptionPrice(),
                    row.getMenuOptionDescription(),
                    maximumNum,
                    row.getDefaultYn(),
                    row.getSoldOutYn()
            ));
        }

        return new ArrayList<>(groupById.values());
    }

    private String normalizeSelectionType(String selectionType) {
        if ("수량 설정".equals(selectionType)) {
            return "03";
        }

        if (!OPTION_SELECTION_TYPES.contains(selectionType)) {
            throw new IllegalStateException(
                    "정의되지 않은 옵션 선택 코드입니다: " + selectionType
            );
        }

        return selectionType;
    }

    private int normalizeMaximumNum(String selectionType, Integer maximumNum) {
        if (!"03".equals(selectionType)) {
            return 0;
        }

        if (maximumNum == null || maximumNum < 1) {
            throw new IllegalStateException("수량 선택 옵션의 최대 수량은 1 이상이어야 합니다.");
        }

        return maximumNum;
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }

        String normalizedValue = value.strip();
        return normalizedValue.isEmpty() ? null : normalizedValue;
    }

    private String escapeLikePattern(String value) {
        if (value == null) {
            return null;
        }

        return value
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
    }

    private void validateMaxLength(String value, int maxLength, String fieldName) {
        if (value != null && value.length() > maxLength) {
            throw new ValidationException(fieldName + "는 " + maxLength + "자 이하여야 합니다.");
        }
    }
}
