import { useEffect, useState } from 'react';
import { ConsumerIcon } from '@/apps/consumer/shared/icons/ConsumerIcon';

type ConsumerMenuImageProps = {
  imageUrl?: string;
  imageClassName: string;
  fallbackIconSize: number;
};

export function ConsumerMenuImage({
  imageUrl,
  imageClassName,
  fallbackIconSize,
}: ConsumerMenuImageProps) {
  const [failedUrl, setFailedUrl] = useState<string>();
  const canShowImage = imageUrl && imageUrl !== failedUrl;

  useEffect(() => {
    const retryFailedImage = () => setFailedUrl(undefined);
    window.addEventListener('online', retryFailedImage);
    return () => window.removeEventListener('online', retryFailedImage);
  }, []);

  if (!canShowImage) {
    return <ConsumerIcon id="ci-utensils" size={fallbackIconSize} />;
  }

  return (
    <img
      src={imageUrl}
      alt=""
      className={imageClassName}
      onError={() => setFailedUrl(imageUrl)}
    />
  );
}
