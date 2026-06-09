package htms.QROrder.common.repository;

import htms.QROrder.common.dto.Combo;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface SearchComboMapper {
    List<Combo> getSearchCommonCombo(String code);
}