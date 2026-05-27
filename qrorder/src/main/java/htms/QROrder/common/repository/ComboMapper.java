package htms.QROrder.common.repository;

import htms.QROrder.common.dto.Combo;
import lombok.Data;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface ComboMapper {
    List<Combo> getCommonCombo(String code);
    List<Combo> getPlantCombo();
}
