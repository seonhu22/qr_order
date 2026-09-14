const CONSUMER_EVENTS_URL = '/api/client/consumer/events';

/**
 * 현재 브라우저 세션에 서버가 결합한 방문 채널을 구독한다.
 * 채널 식별자는 클라이언트가 전달하지 않아 다른 방문을 임의로 구독할 수 없다.
 */
export function createConsumerEventSource(): EventSource {
  return new EventSource(CONSUMER_EVENTS_URL, { withCredentials: true });
}
