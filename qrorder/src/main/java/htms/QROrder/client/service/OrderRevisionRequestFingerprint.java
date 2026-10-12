package htms.QROrder.client.service;

import htms.QROrder.client.dto.OrderRevisionRequest;
import htms.QROrder.consumer.order.dto.ConsumerOrderCreateItemRequest;
import htms.QROrder.consumer.order.dto.ConsumerOrderCreateOptionRequest;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.List;

public final class OrderRevisionRequestFingerprint {
    private OrderRevisionRequestFingerprint() {}

    public static String create(OrderRevisionRequest request) {
        StringBuilder value = new StringBuilder();
        appendStrings(value, sorted(request == null ? null : request.getOrderGroupIds()));
        appendStrings(value, sorted(request == null ? null : request.getRemoveDetailIds()));
        List<Item> items = request == null || request.getAddedItems() == null ? List.of()
                : request.getAddedItems().stream().map(Item::from).sorted().toList();
        value.append(items.size()).append(':');
        items.forEach(item -> item.appendTo(value));
        return sha256(value.toString());
    }

    private static List<String> sorted(List<String> values) {
        return values == null ? List.of() : values.stream().map(OrderRevisionRequestFingerprint::normalize).sorted().toList();
    }

    private static void appendStrings(StringBuilder target, List<String> values) {
        target.append(values.size()).append(':');
        values.forEach(value -> append(target, value));
    }

    private static void append(StringBuilder target, String value) {
        target.append(value.length()).append(':').append(value);
    }

    private static String normalize(String value) {
        return value == null ? "" : value.strip();
    }

    private static String sha256(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 알고리즘을 사용할 수 없습니다.", exception);
        }
    }

    private record Item(String menuId, Integer quantity, List<Option> options) implements Comparable<Item> {
        private static Item from(ConsumerOrderCreateItemRequest source) {
            if (source == null) return new Item("", null, List.of());
            List<Option> options = source.getOptions() == null ? List.of()
                    : source.getOptions().stream().map(Option::from).sorted().toList();
            return new Item(normalize(source.getMenuSysId()), source.getQuantity(), options);
        }
        private void appendTo(StringBuilder target) {
            append(target, menuId); append(target, quantity == null ? "" : quantity.toString());
            target.append(options.size()).append(':'); options.forEach(option -> option.appendTo(target));
        }
        @Override public int compareTo(Item other) {
            int result = menuId.compareTo(other.menuId);
            if (result == 0) result = Comparator.nullsFirst(Integer::compareTo).compare(quantity, other.quantity);
            if (result == 0) result = Integer.compare(options.size(), other.options.size());
            for (int index = 0; result == 0 && index < options.size(); index++) {
                result = options.get(index).compareTo(other.options.get(index));
            }
            return result;
        }
    }

    private record Option(String optionId, Integer quantity) implements Comparable<Option> {
        private static Option from(ConsumerOrderCreateOptionRequest source) {
            return source == null ? new Option("", null) : new Option(normalize(source.getOptionSysId()), source.getQuantity());
        }
        private void appendTo(StringBuilder target) {
            append(target, optionId); append(target, quantity == null ? "" : quantity.toString());
        }
        @Override public int compareTo(Option other) {
            int result = optionId.compareTo(other.optionId);
            return result != 0 ? result : Comparator.nullsFirst(Integer::compareTo).compare(quantity, other.quantity);
        }
    }
}
