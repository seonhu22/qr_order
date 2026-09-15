/**
 * 직원호출 API 계약이 확정되면 이 함수 본문을 httpClient 호출로 교체한다.
 * 지금은 네트워크 호출이 없는 stub이며, 항상 성공으로 처리한다.
 */
export function callStaffStub(_summary: string): Promise<{ success: true }> {
  return Promise.resolve({ success: true });
}
