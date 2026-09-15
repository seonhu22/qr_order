// TODO(QA-bypass): 백엔드 사업자 인증 테스트 데이터 확보 시 본 파일 + useClientSignupFlow.ts 분기 제거.
// 사유: 유효 사업자 데이터 부재로 QA가 회원가입 흐름 끝까지 검증 불가. 로컬 dev 전용 우회.

/**
 * QA용 사업자 인증 우회 판정.
 *
 * 3조건 AND:
 * - import.meta.env.DEV === true (production 빌드에서는 false → tree-shake)
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
