package htms.QROrder.client.repository;

import htms.QROrder.client.dto.*;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface StatusMapper {
    List<StatusHeaderItem> getStatusHeaderItems();
    List<StatusBodyItem> getStatusBodyItems();
    List<StatusFooterItem> getStatusFooterItems();
}
