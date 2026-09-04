package htms.QROrder.consumer.order;

import htms.QROrder.common.exception.ValidationException;
import htms.QROrder.consumer.menu.dto.ConsumerMenuDetailBody;
import htms.QROrder.consumer.menu.dto.ConsumerMenuDetailResponse;
import htms.QROrder.consumer.menu.dto.ConsumerMenuOptionGroup;
import htms.QROrder.consumer.menu.dto.ConsumerMenuOptionItem;
import htms.QROrder.consumer.menu.service.ConsumerMenuService;
import htms.QROrder.consumer.order.dto.ConsumerOrderCreateItemRequest;
import htms.QROrder.consumer.order.dto.ConsumerOrderCreateOptionRequest;
import htms.QROrder.consumer.order.dto.ConsumerOrderCreateRequest;
import htms.QROrder.consumer.order.dto.ValidatedConsumerOrder;
import htms.QROrder.consumer.order.exception.ConsumerOrderConflictException;
import htms.QROrder.consumer.order.exception.ConsumerOrderNotFoundException;
import htms.QROrder.consumer.order.service.ConsumerOrderValidator;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ConsumerOrderValidatorTest {

    private static final String REQUEST_ID = "01K3N8Q9Z6D1F4T2Y7M5C0B8XA";

    private final ConsumerMenuService consumerMenuService = mock(ConsumerMenuService.class);
    private final ConsumerOrderValidator validator = new ConsumerOrderValidator(consumerMenuService);

    @Test
    void calculatesCurrentServerPriceWithoutOptions() {
        givenMenu(menu("N", "N", List.of()));

        ValidatedConsumerOrder result = validator.validate("PLANT-1", request(2, List.of()));

        assertEquals(16_000, result.totalAmount());
        assertEquals(8_000, result.items().get(0).unitAmount());
        assertEquals(16_000, result.items().get(0).lineAmount());
    }

    @Test
    void multipliesPerMenuOptionQuantityForStorageAndPrice() {
        ConsumerMenuOptionGroup group = group("GROUP-1", "03", "Y",
                option("OPTION-1", 500, 3));
        givenMenu(menu("Y", "N", List.of(group)));

        ValidatedConsumerOrder result = validator.validate(
                "PLANT-1", request(2, List.of(optionRequest("OPTION-1", 2))));

        ValidatedConsumerOrder.Option option = result.items().get(0).options().get(0);
        assertEquals(2, option.quantity());
        assertEquals(4, option.storedQuantity());
        assertEquals(2_000, option.lineAmount());
        assertEquals(9_000, result.items().get(0).unitAmount());
        assertEquals(18_000, result.totalAmount());
    }

    @Test
    void rejectsNonBlankRequestNoteUntilStorageExists() {
        ConsumerOrderCreateRequest request = request(1, List.of());
        request.setRequestNote("덜 맵게");

        assertThrows(ValidationException.class,
                () -> validator.validate("PLANT-1", request));
    }

    @Test
    void rejectsSoldOutMenuAsConflict() {
        givenMenu(menu("N", "Y", List.of()));

        assertThrows(ConsumerOrderConflictException.class,
                () -> validator.validate("PLANT-1", request(1, List.of())));
    }

    @Test
    void hidesMenuOutsideCurrentStoreAsNotFound() {
        when(consumerMenuService.getDetail("PLANT-1", "MENU-1")).thenReturn(null);

        assertThrows(ConsumerOrderNotFoundException.class,
                () -> validator.validate("PLANT-1", request(1, List.of())));
    }

    @Test
    void requiresSelectionFromRequiredGroup() {
        ConsumerMenuOptionGroup group = group("GROUP-1", "01", "Y",
                option("OPTION-1", 500, 0));
        givenMenu(menu("Y", "N", List.of(group)));

        assertThrows(ValidationException.class,
                () -> validator.validate("PLANT-1", request(1, List.of())));
    }

    @Test
    void rejectsOptionThatDoesNotBelongToMenu() {
        givenMenu(menu("Y", "N", List.of(group("GROUP-1", "02", "N",
                option("OPTION-1", 500, 0)))));

        assertThrows(ConsumerOrderNotFoundException.class,
                () -> validator.validate("PLANT-1",
                        request(1, List.of(optionRequest("OPTION-OTHER", 1)))));
    }

    @Test
    void rejectsMultipleSelectionsFromSingleChoiceGroup() {
        ConsumerMenuOptionGroup group = group("GROUP-1", "01", "N",
                option("OPTION-1", 500, 0), option("OPTION-2", 700, 0));
        givenMenu(menu("Y", "N", List.of(group)));

        assertThrows(ValidationException.class,
                () -> validator.validate("PLANT-1", request(1, List.of(
                        optionRequest("OPTION-1", 1), optionRequest("OPTION-2", 1)))));
    }

    @Test
    void rejectsQuantityAboveOptionMaximum() {
        ConsumerMenuOptionGroup group = group("GROUP-1", "03", "N",
                option("OPTION-1", 500, 2));
        givenMenu(menu("Y", "N", List.of(group)));

        assertThrows(ValidationException.class,
                () -> validator.validate("PLANT-1",
                        request(1, List.of(optionRequest("OPTION-1", 3)))));
    }

    @Test
    void rejectsDuplicateOptionId() {
        ConsumerMenuOptionGroup group = group("GROUP-1", "02", "N",
                option("OPTION-1", 500, 0));
        givenMenu(menu("Y", "N", List.of(group)));

        assertThrows(ValidationException.class,
                () -> validator.validate("PLANT-1", request(1, List.of(
                        optionRequest("OPTION-1", 1), optionRequest("OPTION-1", 1)))));
    }

    private void givenMenu(ConsumerMenuDetailBody menu) {
        when(consumerMenuService.getDetail("PLANT-1", "MENU-1"))
                .thenReturn(new ConsumerMenuDetailResponse(menu));
    }

    private ConsumerOrderCreateRequest request(
            int menuQuantity,
            List<ConsumerOrderCreateOptionRequest> options) {
        ConsumerOrderCreateItemRequest item = new ConsumerOrderCreateItemRequest();
        item.setMenuSysId("MENU-1");
        item.setQuantity(menuQuantity);
        item.setOptions(options);

        ConsumerOrderCreateRequest request = new ConsumerOrderCreateRequest();
        request.setClientRequestId(REQUEST_ID);
        request.setItems(List.of(item));
        return request;
    }

    private ConsumerOrderCreateOptionRequest optionRequest(String optionSysId, int quantity) {
        ConsumerOrderCreateOptionRequest option = new ConsumerOrderCreateOptionRequest();
        option.setOptionSysId(optionSysId);
        option.setQuantity(quantity);
        return option;
    }

    private ConsumerMenuDetailBody menu(
            String optionUseYn,
            String soldOutYn,
            List<ConsumerMenuOptionGroup> groups) {
        return new ConsumerMenuDetailBody(
                "MENU-1", "CATEGORY-1", "카테고리", "메뉴", 8_000,
                null, null, null, optionUseYn, soldOutYn, groups);
    }

    private ConsumerMenuOptionGroup group(
            String groupId,
            String selectionType,
            String requiredYn,
            ConsumerMenuOptionItem... options) {
        return new ConsumerMenuOptionGroup(
                groupId, "옵션 그룹", requiredYn, selectionType, List.of(options));
    }

    private ConsumerMenuOptionItem option(String optionId, int price, int maximum) {
        return new ConsumerMenuOptionItem(optionId, "옵션", price, null, maximum, "N", "N");
    }
}
