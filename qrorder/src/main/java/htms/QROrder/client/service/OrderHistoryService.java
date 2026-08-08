package htms.QROrder.client.service;

import htms.QROrder.client.dto.*;
import htms.QROrder.client.repository.OrderHistoryMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class OrderHistoryService {

    private final OrderHistoryMapper orderHistoryMapper;

    public OrderHistoryResponse getOrderHistory(String orderStatus,
                                                    String searchKeyword,
                                                    LocalDate startDate,
                                                    LocalDate endDate,
                                                    String sysPlantCd) {

        List<OrderMasterHistoryItem> orderMasterHistory = setMasterTotalPriceData(orderHistoryMapper.getOrderMasterHistory(orderStatus, searchKeyword, startDate, endDate, sysPlantCd));
        List<OrderDetailHistoryItem> orderDetailHistory = setDetailTotalPriceAndOptionData(getOrderDetailHistory(orderMasterHistory));

        OrderHistoryResponse orderHistoryResponse = new OrderHistoryResponse();
        orderHistoryResponse.setOrderMasterHistory(orderMasterHistory);
        orderHistoryResponse.setOrderDetailHistory(orderDetailHistory);

        return orderHistoryResponse;
    }

    private List<OrderDetailHistoryItem> getOrderDetailHistory(List<OrderMasterHistoryItem> orderMasterHistory) {

        if (orderMasterHistory.isEmpty()) return List.of();

        List<String> masterSysIds = new ArrayList<>();
        orderMasterHistory.forEach(item -> {
            masterSysIds.add(item.getSysId());
        });

        return orderHistoryMapper.getOrderDetailHistory(masterSysIds);
    }

    private List<OrderMasterHistoryItem> setMasterTotalPriceData(List<OrderMasterHistoryItem> orderMasterHistory) {

        if (orderMasterHistory.isEmpty()) return orderMasterHistory;

        List<String> listSysId = new ArrayList<>();
        orderMasterHistory.forEach(orderMasterHistoryItem -> {
            listSysId.add(orderMasterHistoryItem.getSysId());
        });

        List<OrderTotalPriceItem> orderTotalPrice = orderHistoryMapper.getOrderMasterTotalPrice(listSysId);

        orderMasterHistory.forEach(dataWithoutPrice ->
                orderTotalPrice.stream()
                        .filter(p -> p.getLinkSysId().equals(dataWithoutPrice.getSysId()))
                        .findFirst()
                        .ifPresent(p -> dataWithoutPrice.setTotalPrice(p.getTotalPrice())));

        return orderMasterHistory;
    }

    private List<OrderDetailHistoryItem> setDetailTotalPriceAndOptionData(List<OrderDetailHistoryItem> orderDetailHistory) {

        if (orderDetailHistory.isEmpty()) return orderDetailHistory;

        List<String> listSysId = new ArrayList<>();
        orderDetailHistory.forEach(orderMasterHistoryItem -> {
            listSysId.add(orderMasterHistoryItem.getSysId());
        });

        List<OrderTotalPriceItem> orderTotalPrice = orderHistoryMapper.getOrderDetailTotalPrice(listSysId);
        List<OrderDetailOptionItem> orderOption = orderHistoryMapper.getOrderDetailOption(listSysId);

        for (var dataWithoutPrice : orderDetailHistory) {
            orderTotalPrice.stream()
                    .filter(p -> p.getLinkSysId().equals(dataWithoutPrice.getSysId()))
                    .findFirst()
                    .ifPresent(p -> dataWithoutPrice.setMenuPrice(p.getTotalPrice() + dataWithoutPrice.getMenuPrice()));

            String formattedOption = orderOption.stream()
                    .filter(opt -> opt.getMasterSysId().equals(dataWithoutPrice.getSysId()))
                    .map(opt -> "- " + opt.getMenuOption())
                    .collect(Collectors.joining("\n"));
            dataWithoutPrice.setMenuOption(formattedOption);
        }

        return orderDetailHistory;
    }
}
