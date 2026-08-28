package htms.QROrder.consumer.order.service;

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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ConsumerOrderValidator {

    private static final Pattern ULID = Pattern.compile("[0-9A-HJKMNP-TV-Z]{26}", Pattern.CASE_INSENSITIVE);
    private static final Pattern UUID = Pattern.compile(
            "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}");

    private final ConsumerMenuService consumerMenuService;

    public ValidatedConsumerOrder validate(String sysPlantCd, ConsumerOrderCreateRequest request) {
        validateRequest(request);

        List<ValidatedConsumerOrder.Item> validatedItems = new ArrayList<>();
        int totalAmount = 0;

        for (ConsumerOrderCreateItemRequest item : request.getItems()) {
            ValidatedConsumerOrder.Item validatedItem = validateItem(sysPlantCd, item);
            validatedItems.add(validatedItem);
            totalAmount = addAmount(totalAmount, validatedItem.lineAmount());
        }

        return new ValidatedConsumerOrder(
                request.getClientRequestId().strip(), List.copyOf(validatedItems), totalAmount);
    }

    private void validateRequest(ConsumerOrderCreateRequest request) {
        if (request == null) {
            throw new ValidationException("주문 요청이 필요합니다.");
        }

        String clientRequestId = normalize(request.getClientRequestId());
        if (clientRequestId == null || !(ULID.matcher(clientRequestId).matches()
                || UUID.matcher(clientRequestId).matches())) {
            throw new ValidationException("clientRequestId는 ULID 또는 UUID 형식이어야 합니다.");
        }
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new ValidationException("주문 항목은 1개 이상이어야 합니다.");
        }
        if (request.getItems().size() > 99) {
            throw new ValidationException("한 번에 주문할 수 있는 메뉴는 99개 이하입니다.");
        }
        if (normalize(request.getRequestNote()) != null) {
            throw new ValidationException("요청사항은 현재 저장할 수 없습니다.");
        }
    }

    private ValidatedConsumerOrder.Item validateItem(String sysPlantCd,
                                                      ConsumerOrderCreateItemRequest requestItem) {
        if (requestItem == null) {
            throw new ValidationException("주문 항목을 확인해주세요.");
        }

        String menuSysId = normalize(requestItem.getMenuSysId());
        validateId(menuSysId, "menuSysId");
        int menuQuantity = validateQuantity(requestItem.getQuantity(), 99, "메뉴 수량");

        ConsumerMenuDetailResponse detail = consumerMenuService.getDetail(sysPlantCd, menuSysId);
        if (detail == null || detail.getBody() == null) {
            throw new ConsumerOrderNotFoundException("주문할 수 없는 메뉴입니다.");
        }

        ConsumerMenuDetailBody menu = detail.getBody();
        if ("Y".equals(menu.getSoldOutYn())) {
            throw new ConsumerOrderConflictException("품절된 메뉴가 포함되어 있습니다.");
        }
        if (menu.getMenuPrice() == null || menu.getMenuPrice() < 0) {
            throw new IllegalStateException("메뉴 가격 정보가 올바르지 않습니다.");
        }

        List<ConsumerOrderCreateOptionRequest> requestedOptions =
                requestItem.getOptions() == null ? List.of() : requestItem.getOptions();
        List<ValidatedConsumerOrder.Option> options = "Y".equals(menu.getOptionUseYn())
                ? validateOptions(menu.getOptionGroupList(), requestedOptions, menuQuantity)
                : rejectOptionsWhenDisabled(requestedOptions);

        int optionUnitAmount = 0;
        for (ValidatedConsumerOrder.Option option : options) {
            optionUnitAmount = addAmount(optionUnitAmount,
                    multiplyAmount(option.unitAmount(), option.quantity()));
        }
        int unitAmount = addAmount(menu.getMenuPrice(), optionUnitAmount);
        int lineAmount = multiplyAmount(unitAmount, menuQuantity);

        return new ValidatedConsumerOrder.Item(
                menuSysId, menuQuantity, menu.getMenuPrice(), unitAmount, lineAmount, options);
    }

    private List<ValidatedConsumerOrder.Option> validateOptions(
            List<ConsumerMenuOptionGroup> groups,
            List<ConsumerOrderCreateOptionRequest> requestedOptions,
            int menuQuantity) {
        List<ConsumerMenuOptionGroup> safeGroups = groups == null ? List.of() : groups;
        Map<String, ConsumerMenuOptionGroup> groupByOptionId = new HashMap<>();
        Map<String, ConsumerMenuOptionItem> optionById = new HashMap<>();

        for (ConsumerMenuOptionGroup group : safeGroups) {
            for (ConsumerMenuOptionItem option : group.getOptionList()) {
                if (optionById.put(option.getMenuOptionSysId(), option) != null) {
                    throw new IllegalStateException("메뉴 옵션 연결 정보가 중복되었습니다.");
                }
                groupByOptionId.put(option.getMenuOptionSysId(), group);
            }
        }

        Map<String, List<ValidatedConsumerOrder.Option>> selectedByGroup = new HashMap<>();
        Set<String> selectedOptionIds = new HashSet<>();
        List<ValidatedConsumerOrder.Option> validatedOptions = new ArrayList<>();

        for (ConsumerOrderCreateOptionRequest requested : requestedOptions) {
            if (requested == null) {
                throw new ValidationException("주문 옵션을 확인해주세요.");
            }
            String optionSysId = normalize(requested.getOptionSysId());
            validateId(optionSysId, "optionSysId");
            if (!selectedOptionIds.add(optionSysId)) {
                throw new ValidationException("같은 옵션을 중복해서 선택할 수 없습니다.");
            }

            ConsumerMenuOptionItem option = optionById.get(optionSysId);
            ConsumerMenuOptionGroup group = groupByOptionId.get(optionSysId);
            if (option == null || group == null) {
                throw new ConsumerOrderNotFoundException("주문할 수 없는 옵션입니다.");
            }
            if (option.getMenuOptionPrice() == null || option.getMenuOptionPrice() < 0) {
                throw new IllegalStateException("메뉴 옵션 가격 정보가 올바르지 않습니다.");
            }

            int maximum = "03".equals(group.getSelectionType()) ? option.getMaximumNum() : 1;
            int quantity = validateQuantity(requested.getQuantity(), maximum, "옵션 수량");
            int storedQuantity = multiplyAmount(quantity, menuQuantity);
            int lineAmount = multiplyAmount(option.getMenuOptionPrice(), storedQuantity);
            ValidatedConsumerOrder.Option validated = new ValidatedConsumerOrder.Option(
                    optionSysId, quantity, storedQuantity, option.getMenuOptionPrice(), lineAmount);
            validatedOptions.add(validated);
            selectedByGroup.computeIfAbsent(group.getOptionGroupSysId(), ignored -> new ArrayList<>())
                    .add(validated);
        }

        validateGroupSelections(safeGroups, selectedByGroup);
        return List.copyOf(validatedOptions);
    }

    private void validateGroupSelections(
            List<ConsumerMenuOptionGroup> groups,
            Map<String, List<ValidatedConsumerOrder.Option>> selectedByGroup) {
        for (ConsumerMenuOptionGroup group : groups) {
            List<ValidatedConsumerOrder.Option> selected = selectedByGroup.getOrDefault(
                    group.getOptionGroupSysId(), List.of());

            if ("Y".equals(group.getRequiredYn()) && selected.isEmpty()) {
                throw new ValidationException("필수 옵션을 선택해주세요: " + group.getGroupName());
            }
            if ("01".equals(group.getSelectionType()) && selected.size() > 1) {
                throw new ValidationException("단일 선택 옵션은 하나만 선택할 수 있습니다: "
                        + group.getGroupName());
            }
            if (!Set.of("01", "02", "03").contains(group.getSelectionType())) {
                throw new IllegalStateException("지원하지 않는 옵션 선택 유형입니다.");
            }
        }
    }

    private List<ValidatedConsumerOrder.Option> rejectOptionsWhenDisabled(
            List<ConsumerOrderCreateOptionRequest> requestedOptions) {
        if (!requestedOptions.isEmpty()) {
            throw new ValidationException("옵션을 사용하지 않는 메뉴입니다.");
        }
        return List.of();
    }

    private int validateQuantity(Integer quantity, Integer maximum, String fieldName) {
        if (quantity == null || quantity < 1 || maximum == null || quantity > maximum) {
            throw new ValidationException(fieldName + "이 허용 범위를 벗어났습니다.");
        }
        return quantity;
    }

    private void validateId(String id, String fieldName) {
        if (id == null || id.length() > 64) {
            throw new ValidationException(fieldName + "를 확인해주세요.");
        }
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.strip();
        return normalized.isEmpty() ? null : normalized;
    }

    private int addAmount(int left, int right) {
        try {
            return Math.addExact(left, right);
        } catch (ArithmeticException exception) {
            throw new ValidationException("주문 금액이 허용 범위를 벗어났습니다.");
        }
    }

    private int multiplyAmount(int left, int right) {
        try {
            return Math.multiplyExact(left, right);
        } catch (ArithmeticException exception) {
            throw new ValidationException("주문 금액이 허용 범위를 벗어났습니다.");
        }
    }
}
