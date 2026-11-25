package htms.QROrder.auth;

import htms.QROrder.auth.controller.SignUpController;
import htms.QROrder.auth.dto.VerifiedBusiness;
import htms.QROrder.auth.exception.BusinessRegiException;
import htms.QROrder.auth.service.SignUpService;
import htms.QROrder.common.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** 가입은 같은 세션에서 chkBRN을 통과한 사업자 정보로만 진행된다(정책 4C §1, A1). */
class SignUpBusinessVerificationTest {
    private final SignUpService service = mock(SignUpService.class);
    private final MockMvc mvc = MockMvcBuilders.standaloneSetup(new SignUpController(service))
            .setControllerAdvice(new GlobalExceptionHandler()).build();

    @Test void signupWithoutBusinessCheckIs400AndWritesNothing() throws Exception {
        mvc.perform(post("/api/auth/signup/new").session(emailVerified()).contentType(APPLICATION_JSON)
                        .content(body("123-45-67890", "홍길동", "2020-01-02")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("사업자 인증을 먼저 완료해주세요."));
        verify(service, never()).newUser(any());
    }

    @Test void signupWithAnotherBusinessNumberThanCheckedIs400() throws Exception {
        var session = emailVerified();
        checkBusiness(session, "1234567890", "홍길동", "2020-01-02");
        mvc.perform(post("/api/auth/signup/new").session(session).contentType(APPLICATION_JSON)
                        .content(body("9999999999", "홍길동", "2020-01-02")))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/auth/signup/new").session(session).contentType(APPLICATION_JSON)
                        .content(body("1234567890", "다른사람", "2020-01-02")))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/auth/signup/new").session(session).contentType(APPLICATION_JSON)
                        .content(body("1234567890", "홍길동", "2021-01-02")))
                .andExpect(status().isBadRequest());
        verify(service, never()).newUser(any());
    }

    @Test void checkedBusinessSignsUpOnceAndVerificationIsConsumed() throws Exception {
        var session = emailVerified();
        checkBusiness(session, "123-45-67890", " 홍길동 ", "2020-01-02");
        assertEquals(new VerifiedBusiness("1234567890", "홍길동", java.time.LocalDate.of(2020, 1, 2)),
                session.getAttribute(VerifiedBusiness.SESSION_KEY));
        mvc.perform(post("/api/auth/signup/new").session(session).contentType(APPLICATION_JSON)
                        .content(body("1234567890", "홍길동", "2020-01-02")))
                .andExpect(status().isOk());
        verify(service, times(1)).newUser(any());
        assertNull(session.getAttribute(VerifiedBusiness.SESSION_KEY));
    }

    @Test void concurrentSignupsInOneSessionReachServiceOnce() throws Exception {
        var session = emailVerified();
        checkBusiness(session, "1234567890", "홍길동", "2020-01-02");
        var inService = new CountDownLatch(1);
        var release = new CountDownLatch(1);
        doAnswer(call -> { inService.countDown(); assertTrue(release.await(5, TimeUnit.SECONDS)); return null; })
                .when(service).newUser(any());
        var executor = Executors.newFixedThreadPool(2);
        try {
            Callable<Integer> signup = () -> mvc.perform(post("/api/auth/signup/new").session(session)
                    .contentType(APPLICATION_JSON).content(body("1234567890", "홍길동", "2020-01-02")))
                    .andReturn().getResponse().getStatus();
            Future<Integer> first = executor.submit(signup);
            assertTrue(inService.await(5, TimeUnit.SECONDS));
            // 첫 요청이 DB 처리 중이어도 인증은 이미 소모되어 두 번째는 400.
            assertNull(session.getAttribute(VerifiedBusiness.SESSION_KEY));
            assertEquals(400, executor.submit(signup).get(5, TimeUnit.SECONDS));
            release.countDown();
            assertEquals(200, first.get(5, TimeUnit.SECONDS));
        } finally {
            release.countDown();
            executor.shutdownNow();
        }
        verify(service, times(1)).newUser(any());
    }

    @Test void newVerificationSavedDuringSignupSurvivesIt() throws Exception {
        var session = emailVerified();
        checkBusiness(session, "1234567890", "홍길동", "2020-01-02");
        doAnswer(call -> {
            session.setAttribute(VerifiedBusiness.SESSION_KEY,
                    new VerifiedBusiness("9999999999", "홍길동", java.time.LocalDate.of(2020, 1, 2)));
            return null;
        }).when(service).newUser(any());
        mvc.perform(post("/api/auth/signup/new").session(session).contentType(APPLICATION_JSON)
                        .content(body("1234567890", "홍길동", "2020-01-02")))
                .andExpect(status().isOk());
        assertNotNull(session.getAttribute(VerifiedBusiness.SESSION_KEY));
    }

    @Test void failedSignupStillConsumesVerification() throws Exception {
        var session = emailVerified();
        checkBusiness(session, "1234567890", "홍길동", "2020-01-02");
        doThrow(new BusinessRegiException("비밀번호와 비밀번호 확인이 일치하지 않습니다.")).when(service).newUser(any());
        mvc.perform(post("/api/auth/signup/new").session(session).contentType(APPLICATION_JSON)
                        .content(body("1234567890", "홍길동", "2020-01-02")))
                .andExpect(status().isBadRequest());
        assertNull(session.getAttribute(VerifiedBusiness.SESSION_KEY));
    }

    @Test void failedRecheckDropsEarlierVerification() throws Exception {
        var session = emailVerified();
        checkBusiness(session, "1234567890", "홍길동", "2020-01-02");
        doThrow(new BusinessRegiException("사업자등록 정보가 일치하지 않습니다.")).when(service).chkBRN(any());
        mvc.perform(post("/api/auth/signup/new/chkBRN").session(session).contentType(APPLICATION_JSON)
                        .content(body("1234567890", "홍길동", "2020-01-02")))
                .andExpect(status().isBadRequest());
        assertNull(session.getAttribute(VerifiedBusiness.SESSION_KEY));
    }

    private void checkBusiness(MockHttpSession session, String number, String name, String date) throws Exception {
        mvc.perform(post("/api/auth/signup/new/chkBRN").session(session).contentType(APPLICATION_JSON)
                        .content(body(number, name, date)))
                .andExpect(status().isOk());
    }

    private static MockHttpSession emailVerified() {
        var session = new MockHttpSession();
        session.setAttribute("signupEmail", "owner@example.test");
        session.setAttribute("signupValidCode", "123456");
        return session;
    }

    private static String body(String number, String name, String date) {
        return """
                {"businessRegiNum":"%s","userNm":"%s","businessRegiDate":"%s","plantNm":"매장",
                 "userId":"owner1","password":"pw-1","passwordChk":"pw-1",
                 "email":"owner@example.test","validCode":"123456"}
                """.formatted(number, name, date);
    }
}
