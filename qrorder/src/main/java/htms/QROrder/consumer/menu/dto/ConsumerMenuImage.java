package htms.QROrder.consumer.menu.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;

/**
 * Consumer 메뉴 이미지 응답 재료.
 *
 * 바이너리 응답이라 CommonResponse(JSON 래퍼)로 감쌀 수 없어,
 * 스트리밍에 필요한 최소 정보만 담아 컨트롤러로 넘긴다.
 */
@Getter
@AllArgsConstructor
public class ConsumerMenuImage {
    private final Resource resource;
    private final MediaType contentType;
}
