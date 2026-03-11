package htms.QROrder.home.repository;

import htms.QROrder.system.domain.Plant;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface HomeMapper {
    public boolean chkDomainExist(String domainUrl);
    public Plant getPlant(String domainUrl);
}
