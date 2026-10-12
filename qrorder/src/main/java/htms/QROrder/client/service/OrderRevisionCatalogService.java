package htms.QROrder.client.service;

import htms.QROrder.client.dto.OrderRevisionCatalogMenuRow;
import htms.QROrder.client.dto.OrderRevisionCatalogOptionRow;
import htms.QROrder.client.dto.OrderRevisionCatalogResponse;
import htms.QROrder.client.repository.OrderRevisionCatalogMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderRevisionCatalogService {

    private static final Set<String> SELECTION_TYPES = Set.of("01", "02", "03");

    private final OrderRevisionCatalogMapper orderRevisionCatalogMapper;

    public OrderRevisionCatalogResponse getCatalog(String sysPlantCd) {
        List<OrderRevisionCatalogMenuRow> menuRows = orderRevisionCatalogMapper.findAvailableMenus(sysPlantCd);

        if (menuRows.isEmpty()) {
            return new OrderRevisionCatalogResponse(List.of());
        }

        menuRows.forEach(this::validateMenuRow);
        Map<String, List<OrderRevisionCatalogResponse.OptionGroup>> groupsByMenu =
                assembleOptionGroups(orderRevisionCatalogMapper.findAvailableOptions(sysPlantCd));
        Map<String, OrderRevisionCatalogResponse.Category> categories = new LinkedHashMap<>();

        for (OrderRevisionCatalogMenuRow row : menuRows) {
            OrderRevisionCatalogResponse.Category category = categories.computeIfAbsent(
                    row.getCategorySysId(),
                    ignored -> new OrderRevisionCatalogResponse.Category(
                            row.getCategorySysId(),
                            row.getCategoryName(),
                            new ArrayList<>()
                    )
            );
            List<OrderRevisionCatalogResponse.OptionGroup> optionGroups = "Y".equals(row.getOptionUseYn())
                    ? groupsByMenu.getOrDefault(row.getMenuSysId(), List.of())
                    : List.of();

            category.getMenus().add(new OrderRevisionCatalogResponse.Menu(
                    row.getMenuSysId(),
                    row.getMenuName(),
                    row.getMenuPrice(),
                    row.getMenuDescription(),
                    row.getOptionUseYn(),
                    row.getSoldOutYn(),
                    optionGroups
            ));
        }

        return new OrderRevisionCatalogResponse(new ArrayList<>(categories.values()));
    }

    private Map<String, List<OrderRevisionCatalogResponse.OptionGroup>> assembleOptionGroups(
            List<OrderRevisionCatalogOptionRow> optionRows) {
        Map<String, LinkedHashMap<String, OrderRevisionCatalogResponse.OptionGroup>> groupsByMenu =
                new LinkedHashMap<>();

        for (OrderRevisionCatalogOptionRow row : optionRows) {
            validateOptionRow(row);
            String selectionType = normalizeSelectionType(row.getSelectionType());
            int maximumNum = normalizeMaximumNum(selectionType, row.getMaximumNum());
            LinkedHashMap<String, OrderRevisionCatalogResponse.OptionGroup> menuGroups =
                    groupsByMenu.computeIfAbsent(row.getMenuSysId(), ignored -> new LinkedHashMap<>());
            OrderRevisionCatalogResponse.OptionGroup group = menuGroups.computeIfAbsent(
                    row.getOptionGroupSysId(),
                    ignored -> new OrderRevisionCatalogResponse.OptionGroup(
                            row.getOptionGroupSysId(),
                            row.getGroupName(),
                            row.getRequiredYn(),
                            selectionType,
                            new ArrayList<>()
                    )
            );

            group.getOptions().add(new OrderRevisionCatalogResponse.Option(
                    row.getMenuOptionSysId(),
                    row.getMenuOptionName(),
                    row.getMenuOptionPrice(),
                    row.getMenuOptionDescription(),
                    maximumNum,
                    row.getDefaultYn(),
                    row.getSoldOutYn()
            ));
        }

        Map<String, List<OrderRevisionCatalogResponse.OptionGroup>> result = new LinkedHashMap<>();
        groupsByMenu.forEach((menuSysId, groups) ->
                result.put(menuSysId, new ArrayList<>(groups.values())));
        return result;
    }

    private String normalizeSelectionType(String selectionType) {
        if ("수량 설정".equals(selectionType)) {
            return "03";
        }
        if (!SELECTION_TYPES.contains(selectionType)) {
            throw new IllegalStateException("정의되지 않은 옵션 선택 코드입니다: " + selectionType);
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

    private void validateMenuRow(OrderRevisionCatalogMenuRow row) {
        requireText(row.getCategorySysId(), "카테고리 ID");
        requireText(row.getCategoryName(), "카테고리 이름");
        requireText(row.getMenuSysId(), "메뉴 ID");
        requireText(row.getMenuName(), "메뉴 이름");
        requireNonNegative(row.getMenuPrice(), "메뉴 가격");
        requireYn(row.getOptionUseYn(), "메뉴 옵션 사용 여부");
        requireAvailable(row.getSoldOutYn(), "메뉴 품절 여부");
    }

    private void validateOptionRow(OrderRevisionCatalogOptionRow row) {
        requireText(row.getMenuSysId(), "옵션의 메뉴 ID");
        requireText(row.getOptionGroupSysId(), "옵션 그룹 ID");
        requireText(row.getGroupName(), "옵션 그룹 이름");
        requireYn(row.getRequiredYn(), "옵션 필수 여부");
        requireText(row.getMenuOptionSysId(), "옵션 ID");
        requireText(row.getMenuOptionName(), "옵션 이름");
        requireNonNegative(row.getMenuOptionPrice(), "옵션 가격");
        requireYn(row.getDefaultYn(), "옵션 기본 선택 여부");
        requireAvailable(row.getSoldOutYn(), "옵션 품절 여부");
    }

    private void requireText(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(fieldName + " 필드가 비어 있습니다.");
        }
    }

    private void requireNonNegative(Integer value, String fieldName) {
        if (value == null || value < 0) {
            throw new IllegalStateException(fieldName + "은 0 이상이어야 합니다.");
        }
    }

    private void requireYn(String value, String fieldName) {
        if (!"Y".equals(value) && !"N".equals(value)) {
            throw new IllegalStateException(fieldName + "는 Y 또는 N이어야 합니다.");
        }
    }

    private void requireAvailable(String soldOutYn, String fieldName) {
        requireYn(soldOutYn, fieldName);
        if (!"N".equals(soldOutYn)) {
            throw new IllegalStateException(fieldName + "는 주문 가능 카탈로그에서 N이어야 합니다.");
        }
    }
}
