import React, { useEffect, useMemo, useState } from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

type Props = {
  images?: string[];
  intervalMs?: number;
  style?: StyleProp<ImageStyle>;
};

export default function ImageRotator({ images, intervalMs = 2000, style }: Props) {
  const imgs = useMemo(() => (Array.isArray(images) ? images : []), [images]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!imgs || imgs.length <= 1) return undefined;
    setIdx(0);
    const id = setInterval(() => setIdx((i) => (i + 1) % imgs.length), intervalMs);
    return () => clearInterval(id);
  }, [imgs, intervalMs]);

  const uri = imgs && imgs.length > 0 ? imgs[idx] : undefined;

  if (uri) return <Image source={{ uri }} style={style} />;
  // fallback to a local placeholder if none
  // eslint-disable-next-line global-require
  return <Image source={require('../../../assets/images/logo.png')} style={style} />;
}
