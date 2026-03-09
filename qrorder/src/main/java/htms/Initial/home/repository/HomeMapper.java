package htms.Initial.home.repository;

import htms.Initial.system.domain.Plant;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface HomeMapper {
    public boolean chkDomainExist(String domainUrl);
    public Plant getPlant(String domainUrl);
}
