interface NakudinLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  variant?: "full" | "icon";
}

const sizeClass = {
  sm: "h-9",
  md: "h-12",
  lg: "h-28",
};

export function NakudinLogo({ size = "md", className = "", variant = "full" }: NakudinLogoProps) {
  if (variant === "icon") {
    return (
      <img
        src="/brand/nakudin-icon.png"
        alt="Nakudin"
        className={`select-none object-contain ${size === "sm" ? "h-9 w-9" : size === "md" ? "h-12 w-12" : "h-20 w-20"} ${className}`}
        loading="eager"
      />
    );
  }

  return (
    <img
      src="/brand/nakudin-logo-transparent.png"
      alt="Nakudin — Curated Modern Goods"
      className={`select-none object-contain ${sizeClass[size]} ${className}`}
      loading="eager"
    />
  );
}
