package htms.QROrder.auth.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.auth.dto.SignUpRequest;
import htms.QROrder.auth.exception.BusinessRegiException;
import htms.QROrder.auth.repository.SignUpMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class SignUpService {

    private final SignUpMapper signUpMapper;
    private final PasswordEncoder passwordEncoder;

    @Value("${nts.api.service-key}")
    private String ntsServiceKey;

    public void chkBRN(SignUpRequest signUpRequest) {

        if (!chkBusinessRegistrationNumberAPI(signUpRequest)) {
            throw new BusinessRegiException("사업자등록 정보가 일치하지 않습니다.");
        }
    }

    public void newUser(SignUpRequest signUpRequest) {

        if (!signUpRequest.getPassword().equals(signUpRequest.getPasswordChk())) {
            throw new BusinessRegiException("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
        }

        signUpRequest.setSysId(UlidCreator.getUlid().toString());
        signUpRequest.setPassword(passwordEncoder.encode(signUpRequest.getPassword()));
        signUpRequest.setPasswordChk(passwordEncoder.encode(signUpRequest.getPasswordChk()));

        signUpMapper.newPlant(signUpRequest);
        signUpMapper.newUser(signUpRequest);
    }

    public boolean idDuplicateChk(String userId) {

        return signUpMapper.idDuplicateChk(userId);
    }

    private boolean chkBusinessRegistrationNumberAPI(SignUpRequest signUpRequest) {
        String businessRegiNum = signUpRequest.getBusinessRegiNum() == null
                ? "" : signUpRequest.getBusinessRegiNum().replaceAll("\\D", "");
        String userNm = signUpRequest.getUserNm() == null
                ? "" : signUpRequest.getUserNm().trim();

        if (businessRegiNum.length() != 10) {
            throw new BusinessRegiException("사업자등록번호 10자리를 입력해주세요.");
        }
        if (signUpRequest.getBusinessRegiDate() == null) {
            throw new BusinessRegiException("개업일을 입력해주세요.");
        }
        if (userNm.isEmpty()) {
            throw new BusinessRegiException("대표자명을 입력해주세요.");
        }

        try {
            RestTemplate restTemplate = new RestTemplate();

            String url = "https://api.odcloud.kr/api/nts-businessman/v1/validate?serviceKey=" + ntsServiceKey;

            Map<String, Object> business = new HashMap<>();
            business.put("b_no", businessRegiNum);
            business.put("start_dt", signUpRequest.getBusinessRegiDate().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd")));
            business.put("p_nm", userNm);
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
        } catch (BusinessRegiException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessRegiException("사업자등록번호 확인 중 오류가 발생했습니다.", e);
        }

        return false;
    }
}
