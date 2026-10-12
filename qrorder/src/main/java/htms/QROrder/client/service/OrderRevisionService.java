package htms.QROrder.client.service;

import htms.QROrder.client.dto.OrderRevisionRequest;
import htms.QROrder.client.dto.OrderRevisionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OrderRevisionService {
    private final OrderRevisionTransactionService transactionService;

    public OrderRevisionResponse revise(String sysPlantCd, String userId, OrderRevisionRequest request) {
        return transactionService.revise(sysPlantCd, userId, request,
                OrderRevisionRequestFingerprint.create(request));
    }
}
