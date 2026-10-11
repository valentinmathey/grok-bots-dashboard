import Image from "next/image";

export function BrandMark({
  size = 36,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/icon.svg"
      alt=""
      width={size}
      height={size}
      className={`shrink-0 rounded-2xl ${className}`}
      unoptimized
    />
  );
}
