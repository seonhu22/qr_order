package htms.QROrder.consumer.order.idempotency;

import htms.QROrder.consumer.order.dto.ConsumerOrderCreateItemRequest;
import htms.QROrder.consumer.order.dto.ConsumerOrderCreateOptionRequest;
import htms.QROrder.consumer.order.dto.ConsumerOrderCreateRequest;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Comparator;
import java.util.List;

public final class ConsumerOrderRequestFingerprint {

    private ConsumerOrderRequestFingerprint() {
    }

    public static String create(ConsumerOrderCreateRequest request) {
        StringBuilder canonical = new StringBuilder();
        append(canonical, normalize(request == null ? null : request.getRequestNote()));

        List<ItemValue> items = request == null || request.getItems() == null
                ? List.of()
                : request.getItems().stream().map(ConsumerOrderRequestFingerprint::toItemValue).sorted().toList();
        canonical.append(items.size()).append(':');
        items.forEach(item -> item.appendTo(canonical));
        return sha256(canonical.toString());
    }

    private static ItemValue toItemValue(ConsumerOrderCreateItemRequest item) {
        if (item == null) {
            return new ItemValue("", null, List.of());
        }
        List<OptionValue> options = item.getOptions() == null
                ? List.of()
                : item.getOptions().stream().map(ConsumerOrderRequestFingerprint::toOptionValue).sorted().toList();
        return new ItemValue(normalize(item.getMenuSysId()), item.getQuantity(), options);
    }

    private static OptionValue toOptionValue(ConsumerOrderCreateOptionRequest option) {
        if (option == null) {
            return new OptionValue("", null);
        }
        return new OptionValue(normalize(option.getOptionSysId()), option.getQuantity());
    }

    private static String normalize(String value) {
        return value == null ? "" : value.strip();
    }

    private static void append(StringBuilder target, String value) {
        target.append(value.length()).append(':').append(value);
    }

    private static void append(StringBuilder target, Integer value) {
        append(target, value == null ? "" : value.toString());
    }

    private static String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 알고리즘을 사용할 수 없습니다.", exception);
        }
    }

    private record ItemValue(String menuSysId, Integer quantity, List<OptionValue> options)
            implements Comparable<ItemValue> {
        private static final Comparator<ItemValue> COMPARATOR = Comparator
                .comparing(ItemValue::menuSysId)
                .thenComparing(ItemValue::quantity, Comparator.nullsFirst(Comparator.naturalOrder()))
                .thenComparing(ItemValue::compareOptions);

        @Override
        public int compareTo(ItemValue other) {
            return COMPARATOR.compare(this, other);
        }

        private static int compareOptions(ItemValue left, ItemValue right) {
            int sharedSize = Math.min(left.options.size(), right.options.size());
            for (int index = 0; index < sharedSize; index++) {
                int comparison = left.options.get(index).compareTo(right.options.get(index));
                if (comparison != 0) {
                    return comparison;
                }
            }
            return Integer.compare(left.options.size(), right.options.size());
        }

        private void appendTo(StringBuilder target) {
            append(target, menuSysId);
            append(target, quantity);
            target.append(options.size()).append(':');
            options.forEach(option -> option.appendTo(target));
        }
    }

    private record OptionValue(String optionSysId, Integer quantity) implements Comparable<OptionValue> {
        private static final Comparator<OptionValue> COMPARATOR = Comparator
                .comparing(OptionValue::optionSysId)
                .thenComparing(OptionValue::quantity, Comparator.nullsFirst(Comparator.naturalOrder()));

        @Override
        public int compareTo(OptionValue other) {
            return COMPARATOR.compare(this, other);
        }

        private void appendTo(StringBuilder target) {
            append(target, optionSysId);
            append(target, quantity);
        }
    }
}
