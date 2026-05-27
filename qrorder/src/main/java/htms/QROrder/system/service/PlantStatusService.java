package htms.QROrder.system.service;

import htms.QROrder.system.dto.PlantStatusResponse;
import htms.QROrder.system.repository.PlantStatusMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class PlantStatusService {

    private final PlantStatusMapper plantStatusMapper;

    public List<PlantStatusResponse> getPlantStatus(String searchKeyword) {

        return plantStatusMapper.getPlantStatus(searchKeyword);
    }
}
