package htms.QROrder.auth.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** 국세청 사업자등록 진위 확인 API. 기본 경로({@link htms.QROrder.config.BusinessVerifierConfig}). */
public class NtsBusinessRegistrationVerifier implements BusinessRegistrationVerifier {

    @Value("${nts.api.service-key}")
    private String ntsServiceKey;

    @Override
    @SuppressWarnings("unchecked")
    public boolean isValid(String businessRegiNum, LocalDate openDate, String representativeName) {
        RestTemplate restTemplate = new RestTemplate();

        String url = "https://api.odcloud.kr/api/nts-businessman/v1/validate?serviceKey=" + ntsServiceKey;

        Map<String, Object> business = new HashMap<>();
        business.put("b_no", businessRegiNum);
        business.put("start_dt", openDate.format(DateTimeFormatter.ofPattern("yyyyMMdd")));
        business.put("p_nm", representativeName);
        business.put("p_nm2", "");
        business.put("b_nm", "");
        business.put("corp_no", "");
        business.put("b_sector", "");
        business.put("b_type", "");
        business.put("b_adr", "");

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("businesses", List.of(business));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            List<Map<String, Object>> data = (List<Map<String, Object>>) response.getBody().get("data");

            if (data != null && !data.isEmpty()) {
                return "01".equals(data.get(0).get("valid"));
            }
        }
        return false;
    }
}
