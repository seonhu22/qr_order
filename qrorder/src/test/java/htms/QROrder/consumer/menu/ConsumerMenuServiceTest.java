package htms.QROrder.consumer.menu;

import htms.QROrder.consumer.menu.dto.ConsumerMenuCategoryItem;
import htms.QROrder.consumer.menu.dto.ConsumerMenuDetailResponse;
import htms.QROrder.consumer.menu.dto.ConsumerMenuItem;
import htms.QROrder.consumer.menu.dto.ConsumerMenuMainResponse;
import htms.QROrder.consumer.menu.dto.ConsumerMenuOptionRow;
import htms.QROrder.consumer.menu.dto.ConsumerMenuSearchResponse;
import htms.QROrder.consumer.menu.repository.ConsumerMenuMapper;
import htms.QROrder.consumer.menu.service.ConsumerMenuService;
import htms.QROrder.common.exception.ValidationException;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

class ConsumerMenuServiceTest {

    @Test
    void assemblesMainResponseFromStoreCategoryAndMenuQueries() {
        ConsumerMenuMapper consumerMenuMapper = mock(ConsumerMenuMapper.class);
        ConsumerMenuService consumerMenuService = new ConsumerMenuService(consumerMenuMapper);

        List<ConsumerMenuCategoryItem> categoryList = List.of(new ConsumerMenuCategoryItem());
        List<ConsumerMenuItem> menuList = List.of(new ConsumerMenuItem());

        when(consumerMenuMapper.getStoreName("PC002")).thenReturn("테스트 매장");
        when(consumerMenuMapper.getCategoryList("PC002")).thenReturn(categoryList);
        when(consumerMenuMapper.searchMenuList("PC002", null, null)).thenReturn(menuList);

        ConsumerMenuMainResponse response = consumerMenuService.getMain("PC002", 10);

        assertEquals("테스트 매장", response.getStoreName());
        assertEquals(10, response.getTableNum());
        assertSame(categoryList, response.getHeader().getCategoryList());
        assertSame(menuList, response.getBody().getMenuList());

        verify(consumerMenuMapper).getStoreName("PC002");
        verify(consumerMenuMapper).getCategoryList("PC002");
        verify(consumerMenuMapper).searchMenuList("PC002", null, null);
    }

    @Test
    void returnsNullWithoutQueryingMenusWhenStoreIsNoLongerAvailable() {
        ConsumerMenuMapper consumerMenuMapper = mock(ConsumerMenuMapper.class);
        ConsumerMenuService consumerMenuService = new ConsumerMenuService(consumerMenuMapper);

        when(consumerMenuMapper.getStoreName("PC002")).thenReturn(null);

        ConsumerMenuMainResponse response = consumerMenuService.getMain("PC002", 10);

        assertNull(response);
        verify(consumerMenuMapper).getStoreName("PC002");
        verifyNoMoreInteractions(consumerMenuMapper);
    }

    @Test
    void normalizesSearchConditionsAndAssemblesMenuBody() {
        ConsumerMenuMapper consumerMenuMapper = mock(ConsumerMenuMapper.class);
        ConsumerMenuService consumerMenuService = new ConsumerMenuService(consumerMenuMapper);
        List<ConsumerMenuItem> menuList = List.of(new ConsumerMenuItem());

        when(consumerMenuMapper.getStoreName("PC002")).thenReturn("테스트 매장");
        when(consumerMenuMapper.searchMenuList("PC002", "불고기", "category-1"))
                .thenReturn(menuList);

        ConsumerMenuSearchResponse response = consumerMenuService.search(
                "PC002",
                "  불고기  ",
                "  category-1  "
        );

        assertSame(menuList, response.getBody().getMenuList());
        verify(consumerMenuMapper).getStoreName("PC002");
        verify(consumerMenuMapper).searchMenuList("PC002", "불고기", "category-1");
    }

    @Test
    void treatsBlankSearchConditionsAsMissing() {
        ConsumerMenuMapper consumerMenuMapper = mock(ConsumerMenuMapper.class);
        ConsumerMenuService consumerMenuService = new ConsumerMenuService(consumerMenuMapper);

        when(consumerMenuMapper.getStoreName("PC002")).thenReturn("테스트 매장");
        when(consumerMenuMapper.searchMenuList("PC002", null, null)).thenReturn(List.of());

        ConsumerMenuSearchResponse response = consumerMenuService.search("PC002", "\u3000", "\u3000");

        assertEquals(0, response.getBody().getMenuList().size());
        verify(consumerMenuMapper).searchMenuList("PC002", null, null);
    }

    @Test
    void escapesLikeWildcardsBeforeSearching() {
        ConsumerMenuMapper consumerMenuMapper = mock(ConsumerMenuMapper.class);
        ConsumerMenuService consumerMenuService = new ConsumerMenuService(consumerMenuMapper);

        when(consumerMenuMapper.getStoreName("PC002")).thenReturn("테스트 매장");
        when(consumerMenuMapper.searchMenuList("PC002", "50\\%\\_할인\\\\메뉴", null))
                .thenReturn(List.of());

        consumerMenuService.search("PC002", "50%_할인\\메뉴", null);

        verify(consumerMenuMapper).searchMenuList("PC002", "50\\%\\_할인\\\\메뉴", null);
    }

    @Test
    void rejectsOverlongSearchConditionsBeforeQueryingStore() {
        ConsumerMenuMapper consumerMenuMapper = mock(ConsumerMenuMapper.class);
        ConsumerMenuService consumerMenuService = new ConsumerMenuService(consumerMenuMapper);

        ValidationException exception = assertThrows(
                ValidationException.class,
                () -> consumerMenuService.search("PC002", "가".repeat(101), null)
        );

        assertEquals("검색어는 100자 이하여야 합니다.", exception.getMessage());
        verifyNoMoreInteractions(consumerMenuMapper);
    }

    @Test
    void returnsNullWithoutSearchingWhenStoreIsNoLongerAvailable() {
        ConsumerMenuMapper consumerMenuMapper = mock(ConsumerMenuMapper.class);
        ConsumerMenuService consumerMenuService = new ConsumerMenuService(consumerMenuMapper);

        when(consumerMenuMapper.getStoreName("PC002")).thenReturn(null);

        ConsumerMenuSearchResponse response = consumerMenuService.search(
                "PC002",
                "불고기",
                "category-1"
        );

        assertNull(response);
        verify(consumerMenuMapper).getStoreName("PC002");
        verifyNoMoreInteractions(consumerMenuMapper);
    }

    @Test
    void assemblesOrderedOptionGroupsForMenuDetail() {
        ConsumerMenuMapper consumerMenuMapper = mock(ConsumerMenuMapper.class);
        ConsumerMenuService consumerMenuService = new ConsumerMenuService(consumerMenuMapper);

        ConsumerMenuItem menu = menu("menu-1", "Y");
        List<ConsumerMenuOptionRow> rows = List.of(
                optionRow("group-1", "맵기", "Y", "01", "option-1", "보통맛", null),
                optionRow("group-1", "맵기", "Y", "01", "option-2", "매운맛", 0),
                optionRow("group-2", "토핑 수량", "N", "수량 설정", "option-3", "치즈", 3)
        );

        when(consumerMenuMapper.getMenuDetail("PC002", "menu-1")).thenReturn(menu);
        when(consumerMenuMapper.getMenuOptionRows("PC002", "menu-1")).thenReturn(rows);

        ConsumerMenuDetailResponse response = consumerMenuService.getDetail("PC002", "menu-1");

        assertEquals("menu-1", response.getBody().getMenuSysId());
        assertEquals(2, response.getBody().getOptionGroupList().size());
        assertEquals("group-1", response.getBody().getOptionGroupList().get(0).getOptionGroupSysId());
        assertEquals("option-2", response.getBody().getOptionGroupList().get(0).getOptionList().get(1).getMenuOptionSysId());
        assertEquals(0, response.getBody().getOptionGroupList().get(0).getOptionList().get(0).getMaximumNum());
        assertEquals("03", response.getBody().getOptionGroupList().get(1).getSelectionType());
        assertEquals(3, response.getBody().getOptionGroupList().get(1).getOptionList().get(0).getMaximumNum());
    }

    @Test
    void skipsOptionQueryWhenMenuDoesNotUseOptions() {
        ConsumerMenuMapper consumerMenuMapper = mock(ConsumerMenuMapper.class);
        ConsumerMenuService consumerMenuService = new ConsumerMenuService(consumerMenuMapper);

        when(consumerMenuMapper.getMenuDetail("PC002", "menu-1")).thenReturn(menu("menu-1", "N"));

        ConsumerMenuDetailResponse response = consumerMenuService.getDetail("PC002", "menu-1");

        assertEquals(0, response.getBody().getOptionGroupList().size());
        verify(consumerMenuMapper).getMenuDetail("PC002", "menu-1");
        verifyNoMoreInteractions(consumerMenuMapper);
    }

    @Test
    void returnsNullWithoutQueryingOptionsWhenMenuIsUnavailable() {
        ConsumerMenuMapper consumerMenuMapper = mock(ConsumerMenuMapper.class);
        ConsumerMenuService consumerMenuService = new ConsumerMenuService(consumerMenuMapper);

        when(consumerMenuMapper.getMenuDetail("PC002", "missing-menu")).thenReturn(null);

        assertNull(consumerMenuService.getDetail("PC002", "missing-menu"));
        verify(consumerMenuMapper).getMenuDetail("PC002", "missing-menu");
        verifyNoMoreInteractions(consumerMenuMapper);
    }

    @Test
    void rejectsOverlongMenuIdBeforeQueryingMenu() {
        ConsumerMenuMapper consumerMenuMapper = mock(ConsumerMenuMapper.class);
        ConsumerMenuService consumerMenuService = new ConsumerMenuService(consumerMenuMapper);

        ValidationException exception = assertThrows(
                ValidationException.class,
                () -> consumerMenuService.getDetail("PC002", "m".repeat(65))
        );

        assertEquals("메뉴 ID는 64자 이하여야 합니다.", exception.getMessage());
        verifyNoMoreInteractions(consumerMenuMapper);
    }

    @Test
    void rejectsUnknownOptionSelectionType() {
        ConsumerMenuMapper consumerMenuMapper = mock(ConsumerMenuMapper.class);
        ConsumerMenuService consumerMenuService = new ConsumerMenuService(consumerMenuMapper);

        when(consumerMenuMapper.getMenuDetail("PC002", "menu-1")).thenReturn(menu("menu-1", "Y"));
        when(consumerMenuMapper.getMenuOptionRows("PC002", "menu-1")).thenReturn(List.of(
                optionRow("group-1", "맵기", "Y", "주문 옵션", "option-1", "보통맛", 0)
        ));

        assertThrows(
                IllegalStateException.class,
                () -> consumerMenuService.getDetail("PC002", "menu-1")
        );
    }

    @Test
    void rejectsNonPositiveMaximumForQuantitySelection() {
        ConsumerMenuMapper consumerMenuMapper = mock(ConsumerMenuMapper.class);
        ConsumerMenuService consumerMenuService = new ConsumerMenuService(consumerMenuMapper);

        when(consumerMenuMapper.getMenuDetail("PC002", "menu-1")).thenReturn(menu("menu-1", "Y"));
        when(consumerMenuMapper.getMenuOptionRows("PC002", "menu-1")).thenReturn(List.of(
                optionRow("group-1", "수량", "Y", "03", "option-1", "치즈", 0)
        ));

        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> consumerMenuService.getDetail("PC002", "menu-1")
        );

        assertEquals("수량 선택 옵션의 최대 수량은 1 이상이어야 합니다.", exception.getMessage());
    }

    private ConsumerMenuItem menu(String menuSysId, String optionUseYn) {
        ConsumerMenuItem menu = new ConsumerMenuItem();
        menu.setMenuSysId(menuSysId);
        menu.setCategorySysId("category-1");
        menu.setCategoryName("버거");
        menu.setMenuName("불고기 버거");
        menu.setMenuPrice(8000);
        menu.setOptionUseYn(optionUseYn);
        menu.setSoldOutYn("N");
        return menu;
    }

    private ConsumerMenuOptionRow optionRow(
            String groupSysId,
            String groupName,
            String requiredYn,
            String selectionType,
            String optionSysId,
            String optionName,
            Integer maximumNum) {
        ConsumerMenuOptionRow row = new ConsumerMenuOptionRow();
        row.setOptionGroupSysId(groupSysId);
        row.setGroupName(groupName);
        row.setRequiredYn(requiredYn);
        row.setSelectionType(selectionType);
        row.setMenuOptionSysId(optionSysId);
        row.setMenuOptionName(optionName);
        row.setMenuOptionPrice(1000);
        row.setMaximumNum(maximumNum);
        row.setDefaultYn("N");
        return row;
    }
}
