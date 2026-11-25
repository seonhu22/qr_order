package htms.QROrder.system.billing.provider;

/** 제공자 조회/요청 실패. 웹훅 처리에서는 503으로 답해 제공자 재전송에 맡긴다. */
public class ProviderUnavailableException extends RuntimeException {
    public ProviderUnavailableException(String message) {
        super(message);
    }

    public ProviderUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
