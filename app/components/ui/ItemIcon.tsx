import Image from 'next/image';
import { cn } from '@/lib/cn';

type ItemIconProps = {
  src: string;
  size?: number;
  className?: string;
};

export function ItemIcon({ src, size = 32, className }: ItemIconProps) {
  if (!src) {
    return <span aria-hidden className={cn('inline-block shrink-0 rounded bg-surface-2', className)} style={{ width: size, height: size }} />;
  }
  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      unoptimized
      className={cn('shrink-0 rounded bg-surface-2 object-contain', className)}
    />
  );
}
