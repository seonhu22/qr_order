package htms.QROrder.client;

import htms.QROrder.client.dto.OrderRevisionCatalogMenuRow;
import htms.QROrder.client.dto.OrderRevisionCatalogOptionRow;
import htms.QROrder.client.dto.OrderRevisionCatalogResponse;
import htms.QROrder.client.repository.OrderRevisionCatalogMapper;
import htms.QROrder.client.service.OrderRevisionCatalogService;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.function.Consumer;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

class OrderRevisionCatalogServiceTest {

    @Test
    void returnsEmptyCatalogWithoutQueryingOptionsWhenStoreHasNoAvailableMenus() {
        OrderRevisionCatalogMapper mapper = mock(OrderRevisionCatalogMapper.class);
        when(mapper.findAvailableMenus("PLANT-1")).thenReturn(List.of());

        OrderRevisionCatalogResponse response = new OrderRevisionCatalogService(mapper).getCatalog("PLANT-1");

        assertEquals(List.of(), response.getCategories());
        verify(mapper).findAvailableMenus("PLANT-1");
        verifyNoMoreInteractions(mapper);
    }

    @Test
    void keepsTenantBoundaryAndAssemblesCategoriesMenusAndAllOptionTypes() {
        OrderRevisionCatalogMapper mapper = mock(OrderRevisionCatalogMapper.class);
        when(mapper.findAvailableMenus("PLANT-1")).thenReturn(List.of(
                menu("CATEGORY-1", "메인", "MENU-1", "불고기", "Y"),
                menu("CATEGORY-1", "메인", "MENU-2", "감자전", "N")
        ));
        when(mapper.findAvailableOptions("PLANT-1")).thenReturn(List.of(
                option("MENU-1", "GROUP-1", "맵기", "Y", "01", "OPTION-1", "보통맛", null, "Y"),
                option("MENU-1", "GROUP-2", "소스", "N", "02", "OPTION-2", "케첩", 12, "N"),
                option("MENU-1", "GROUP-3", "치즈", "N", "수량 설정", "OPTION-3", "치즈", 4, "N")
        ));

        OrderRevisionCatalogResponse response = new OrderRevisionCatalogService(mapper).getCatalog("PLANT-1");

        assertEquals(1, response.getCategories().size());
        assertEquals(2, response.getCategories().get(0).getMenus().size());
        OrderRevisionCatalogResponse.Menu firstMenu = response.getCategories().get(0).getMenus().get(0);
        assertEquals(3, firstMenu.getOptionGroups().size());
        assertEquals("01", firstMenu.getOptionGroups().get(0).getSelectionType());
        assertEquals("02", firstMenu.getOptionGroups().get(1).getSelectionType());
        assertEquals("03", firstMenu.getOptionGroups().get(2).getSelectionType());
        assertEquals(0, firstMenu.getOptionGroups().get(0).getOptions().get(0).getMaximumNum());
        assertEquals(0, firstMenu.getOptionGroups().get(1).getOptions().get(0).getMaximumNum());
        assertEquals(4, firstMenu.getOptionGroups().get(2).getOptions().get(0).getMaximumNum());
        assertEquals("Y", firstMenu.getOptionGroups().get(0).getRequiredYn());
        assertEquals("Y", firstMenu.getOptionGroups().get(0).getOptions().get(0).getDefaultYn());
        assertEquals("N", firstMenu.getOptionGroups().get(0).getOptions().get(0).getSoldOutYn());
        assertEquals(List.of(), response.getCategories().get(0).getMenus().get(1).getOptionGroups());
        verify(mapper).findAvailableMenus("PLANT-1");
        verify(mapper).findAvailableOptions("PLANT-1");
    }

    @Test
    void rejectsUnknownOptionSelectionType() {
        OrderRevisionCatalogMapper mapper = mock(OrderRevisionCatalogMapper.class);
        when(mapper.findAvailableMenus("PLANT-1"))
                .thenReturn(List.of(menu("CATEGORY-1", "메인", "MENU-1", "불고기", "Y")));
        when(mapper.findAvailableOptions("PLANT-1")).thenReturn(List.of(
                option("MENU-1", "GROUP-1", "기타", "N", "UNKNOWN", "OPTION-1", "기타", 0, "N")
        ));

        assertThrows(IllegalStateException.class,
                () -> new OrderRevisionCatalogService(mapper).getCatalog("PLANT-1"));
    }

    @Test
    void rejectsNonPositiveMaximumForQuantityOption() {
        OrderRevisionCatalogMapper mapper = mock(OrderRevisionCatalogMapper.class);
        when(mapper.findAvailableMenus("PLANT-1"))
                .thenReturn(List.of(menu("CATEGORY-1", "메인", "MENU-1", "불고기", "Y")));
        when(mapper.findAvailableOptions("PLANT-1")).thenReturn(List.of(
                option("MENU-1", "GROUP-1", "치즈", "N", "03", "OPTION-1", "치즈", 0, "N")
        ));

        IllegalStateException exception = assertThrows(IllegalStateException.class,
                () -> new OrderRevisionCatalogService(mapper).getCatalog("PLANT-1"));
        assertEquals("수량 선택 옵션의 최대 수량은 1 이상이어야 합니다.", exception.getMessage());
    }

    @Test
    void rejectsNullOrNegativeMenuPrice() {
        assertInvalidMenu(row -> row.setMenuPrice(null), "메뉴 가격은 0 이상이어야 합니다.");
        assertInvalidMenu(row -> row.setMenuPrice(-1), "메뉴 가격은 0 이상이어야 합니다.");
    }

    @Test
    void rejectsNullOrNegativeOptionPrice() {
        assertInvalidOption(row -> row.setMenuOptionPrice(null), "옵션 가격은 0 이상이어야 합니다.");
        assertInvalidOption(row -> row.setMenuOptionPrice(-1), "옵션 가격은 0 이상이어야 합니다.");
    }

    @Test
    void rejectsBlankRequiredMenuAndCategoryIdentity() {
        assertInvalidMenu(row -> row.setCategorySysId(" "), "카테고리 ID 필드가 비어 있습니다.");
        assertInvalidMenu(row -> row.setCategoryName(null), "카테고리 이름 필드가 비어 있습니다.");
        assertInvalidMenu(row -> row.setMenuSysId(""), "메뉴 ID 필드가 비어 있습니다.");
        assertInvalidMenu(row -> row.setMenuName(null), "메뉴 이름 필드가 비어 있습니다.");
    }

    @Test
    void rejectsInvalidMenuFlagsAndRequiresReturnedMenusToBeAvailable() {
        assertInvalidMenu(row -> row.setOptionUseYn("X"), "메뉴 옵션 사용 여부는 Y 또는 N이어야 합니다.");
        assertInvalidMenu(row -> row.setSoldOutYn(null), "메뉴 품절 여부는 Y 또는 N이어야 합니다.");
        assertInvalidMenu(row -> row.setSoldOutYn("Y"),
                "메뉴 품절 여부는 주문 가능 카탈로그에서 N이어야 합니다.");
    }

    @Test
    void rejectsBlankRequiredOptionAndGroupIdentity() {
        assertInvalidOption(row -> row.setMenuSysId(" "), "옵션의 메뉴 ID 필드가 비어 있습니다.");
        assertInvalidOption(row -> row.setOptionGroupSysId(null), "옵션 그룹 ID 필드가 비어 있습니다.");
        assertInvalidOption(row -> row.setGroupName(""), "옵션 그룹 이름 필드가 비어 있습니다.");
        assertInvalidOption(row -> row.setMenuOptionSysId(null), "옵션 ID 필드가 비어 있습니다.");
        assertInvalidOption(row -> row.setMenuOptionName(" "), "옵션 이름 필드가 비어 있습니다.");
    }

    @Test
    void rejectsInvalidOptionFlagsAndRequiresReturnedOptionsToBeAvailable() {
        assertInvalidOption(row -> row.setRequiredYn("X"), "옵션 필수 여부는 Y 또는 N이어야 합니다.");
        assertInvalidOption(row -> row.setDefaultYn(null), "옵션 기본 선택 여부는 Y 또는 N이어야 합니다.");
        assertInvalidOption(row -> row.setSoldOutYn("X"), "옵션 품절 여부는 Y 또는 N이어야 합니다.");
        assertInvalidOption(row -> row.setSoldOutYn("Y"),
                "옵션 품절 여부는 주문 가능 카탈로그에서 N이어야 합니다.");
    }

    private void assertInvalidMenu(
            Consumer<OrderRevisionCatalogMenuRow> mutation,
            String expectedMessage) {
        OrderRevisionCatalogMapper mapper = mock(OrderRevisionCatalogMapper.class);
        OrderRevisionCatalogMenuRow row = menu("CATEGORY-1", "메인", "MENU-1", "불고기", "N");
        mutation.accept(row);
        when(mapper.findAvailableMenus("PLANT-1")).thenReturn(List.of(row));

        IllegalStateException exception = assertThrows(IllegalStateException.class,
                () -> new OrderRevisionCatalogService(mapper).getCatalog("PLANT-1"));
        assertEquals(expectedMessage, exception.getMessage());
    }

    private void assertInvalidOption(
            Consumer<OrderRevisionCatalogOptionRow> mutation,
            String expectedMessage) {
        OrderRevisionCatalogMapper mapper = mock(OrderRevisionCatalogMapper.class);
        when(mapper.findAvailableMenus("PLANT-1"))
                .thenReturn(List.of(menu("CATEGORY-1", "메인", "MENU-1", "불고기", "Y")));
        OrderRevisionCatalogOptionRow row = option(
                "MENU-1", "GROUP-1", "맵기", "N", "01", "OPTION-1", "보통맛", 0, "N");
        mutation.accept(row);
        when(mapper.findAvailableOptions("PLANT-1")).thenReturn(List.of(row));

        IllegalStateException exception = assertThrows(IllegalStateException.class,
                () -> new OrderRevisionCatalogService(mapper).getCatalog("PLANT-1"));
        assertEquals(expectedMessage, exception.getMessage());
    }

    private OrderRevisionCatalogMenuRow menu(
            String categorySysId,
            String categoryName,
            String menuSysId,
            String menuName,
            String optionUseYn) {
        OrderRevisionCatalogMenuRow row = new OrderRevisionCatalogMenuRow();
        row.setCategorySysId(categorySysId);
        row.setCategoryName(categoryName);
        row.setMenuSysId(menuSysId);
        row.setMenuName(menuName);
        row.setMenuPrice(8000);
        row.setOptionUseYn(optionUseYn);
        row.setSoldOutYn("N");
        return row;
    }

    private OrderRevisionCatalogOptionRow option(
            String menuSysId,
            String groupSysId,
            String groupName,
            String requiredYn,
            String selectionType,
            String optionSysId,
            String optionName,
            Integer maximumNum,
            String defaultYn) {
        OrderRevisionCatalogOptionRow row = new OrderRevisionCatalogOptionRow();
        row.setMenuSysId(menuSysId);
        row.setOptionGroupSysId(groupSysId);
        row.setGroupName(groupName);
        row.setRequiredYn(requiredYn);
        row.setSelectionType(selectionType);
        row.setMenuOptionSysId(optionSysId);
        row.setMenuOptionName(optionName);
        row.setMenuOptionPrice(1000);
        row.setMaximumNum(maximumNum);
        row.setDefaultYn(defaultYn);
        row.setSoldOutYn("N");
        return row;
    }
}
