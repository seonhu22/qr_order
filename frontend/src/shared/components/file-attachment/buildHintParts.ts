export type HintPartsConfig = {
  maxSize?: string;
  maxTotalSize?: string;
  maxCount?: number;
  allowedExts?: readonly string[];
};

export function buildHintParts(config: HintPartsConfig): string[] {
  const { maxSize, maxTotalSize, maxCount, allowedExts } = config;
  const extStr = allowedExts?.join(' · ') ?? '';
  return [
    maxSize && `파일당 최대 ${maxSize}`,
    maxTotalSize && `전체 최대 ${maxTotalSize}`,
    maxCount && `최대 ${maxCount}개`,
    extStr || undefined,
  ].filter(Boolean) as string[];
}
