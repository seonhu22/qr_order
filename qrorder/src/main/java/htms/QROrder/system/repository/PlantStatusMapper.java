package htms.QROrder.system.repository;

import htms.QROrder.system.dto.PlantStatusResponse;
import org.apache.ibatis.annotations.Mapper;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@Mapper
public interface PlantStatusMapper {
    List<PlantStatusResponse> getPlantStatus(String searchKeyword);
}
