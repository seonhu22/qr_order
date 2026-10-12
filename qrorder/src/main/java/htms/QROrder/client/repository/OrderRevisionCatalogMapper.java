package htms.QROrder.client.repository;

import htms.QROrder.client.dto.OrderRevisionCatalogMenuRow;
import htms.QROrder.client.dto.OrderRevisionCatalogOptionRow;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface OrderRevisionCatalogMapper {
    List<OrderRevisionCatalogMenuRow> findAvailableMenus(@Param("sysPlantCd") String sysPlantCd);

    List<OrderRevisionCatalogOptionRow> findAvailableOptions(@Param("sysPlantCd") String sysPlantCd);
}
