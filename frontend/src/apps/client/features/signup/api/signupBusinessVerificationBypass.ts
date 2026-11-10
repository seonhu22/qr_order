// TODO(QA-bypass): 테스트 데이터 또는 NTS mock 확보 후 우회 OFF 가입 QA 통과 시 제거.
// 제거 범위와 검증 기준: frontend/docs/qa-bypass-business-verification.md
// 사유: 유효 사업자 데이터 부재로 QA가 회원가입 흐름 끝까지 검증 불가. 로컬 dev 전용 우회.

/**
 * QA용 사업자 인증 우회 판정.
 *
 * 3조건 AND:
 * - import.meta.env.DEV === true (production 환경에서는 false)
 * - VITE_BYPASS_BUSINESS_VERIFICATION === 'true' (로컬 .env.local에서만 설정)
 * - error의 HTTP status === 400 (BusinessRegiException 매핑)
 *
 * 401/403/500/network error는 우회하지 않는다.
 */
export function shouldBypassBusinessVerificationError(error: unknown): boolean {
  if (!import.meta.env.DEV) return false;
  if (import.meta.env.VITE_BYPASS_BUSINESS_VERIFICATION !== 'true') return false;
  return extractHttpStatus(error) === 400;
}

function extractHttpStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;

  if ('status' in error && typeof (error as { status: unknown }).status === 'number') {
    return (error as { status: number }).status;
  }

  if ('response' in error) {
    const res = (error as { response?: unknown }).response;
    if (res && typeof res === 'object' && 'status' in res) {
      const status = (res as { status: unknown }).status;
      if (typeof status === 'number') return status;
    }
  }

  return undefined;
}
