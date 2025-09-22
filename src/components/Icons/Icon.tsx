// src/components/Icon.tsx
import React from "react";
import Icons, { type IconName } from "@/assets/icons";

interface IconProps {
  name: IconName; // strict typing with IntelliSense
  width?: number | string;
  height?: number | string;
  color?: string;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLImageElement>; // ✅ add onClick
}

const Icon: React.FC<IconProps> = ({
  name,
  width = 24,
  height = 24,
  color = "currentColor",
  className,
  onClick,
}) => {
  const IconSrc = Icons[name];

  if (!IconSrc) {
    console.warn(`Icon "${name}" not found in assets/icons`);
    return null;
  }

  return (
    <img
      src={IconSrc}
      alt={name}
      width={width}
      height={height}
      style={{ color }}
      className={className}
      onClick={onClick} // ✅ pass click handler
    />
  );
};

export default Icon;
