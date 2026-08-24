package htms.QROrder.consumer.menu.repository;

import htms.QROrder.consumer.menu.dto.ConsumerMenuCategoryItem;
import htms.QROrder.consumer.menu.dto.ConsumerMenuItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ConsumerMenuMapper {
    String getStoreName(@Param("sysPlantCd") String sysPlantCd);

    List<ConsumerMenuCategoryItem> getCategoryList(@Param("sysPlantCd") String sysPlantCd);

    List<ConsumerMenuItem> getMenuList(@Param("sysPlantCd") String sysPlantCd);

    List<ConsumerMenuItem> searchMenuList(
            @Param("sysPlantCd") String sysPlantCd,
            @Param("searchKeyword") String searchKeyword,
            @Param("categorySysId") String categorySysId
    );
}
