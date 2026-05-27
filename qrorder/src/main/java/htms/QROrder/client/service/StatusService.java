package htms.QROrder.client.service;

import htms.QROrder.client.dto.*;
import htms.QROrder.client.repository.StatusMapper;
import htms.QROrder.common.dto.Combo;
import htms.QROrder.common.repository.ComboMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class StatusService {

    private final StatusMapper statusMapper;
    private final ComboMapper comboMapper;

    public List<StatusResponse> getStatus(){

        return orderNumClassification();
    }

    private List<StatusResponse> orderNumClassification() {

        List<StatusHeaderItem> header = statusMapper.getStatusHeaderItems();
        List<StatusBodyItem> body = statusMapper.getStatusBodyItems();
        List<StatusFooterItem> footer = statusMapper.getStatusFooterItems();

        List<StatusItem> statusItems = new ArrayList<>();

        header.forEach(head -> {
            StatusItem statusItem = new StatusItem();

            statusItem.setHeader(head);
            statusItem.setBody(body.stream()
                    .filter(b -> b.getLinkSysId().equals(head.getSysId()))
                    .collect(Collectors.toList()));
            statusItem.setFooter(footer.stream()
                    .filter(f -> f.getSysId().equals(head.getSysId()))
                    .findFirst()
                    .orElse(null));

            statusItems.add(statusItem);
        });

        return statusClassification(statusItems);
    }

    private List<StatusResponse> statusClassification(List<StatusItem> statusItems) {

        Map<String, List<StatusItem>> grouped = statusItems.stream()
                .collect(Collectors.groupingBy(item -> item.getHeader().getOrderStatus()));

        List<StatusResponse> statusResponseList = new ArrayList<>();

        grouped.forEach((flag, items) -> {
            StatusResponse statusResponse = new StatusResponse();

            statusResponse.setStatusFlag(flag);
            statusResponse.setStatusList(items);

            statusResponseList.add(statusResponse);
        });

        return statusResponseList;
    }
}
