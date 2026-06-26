interface NakudinLogoProps {
    size?: "sm" | "md" | "lg";
    className?: string;
  }

  export function NakudinLogo({ size = "md", className = "" }: NakudinLogoProps) {
    const sizeClass = {
      sm: "text-xl",
      md: "text-3xl",
      lg: "text-4xl",
    }[size];

    return (
      <span className={`font-extrabold tracking-tight select-none ${sizeClass} ${className}`}>
        <span className="text-[#00D9FF]">Na</span>
        <span className="text-foreground">kudin</span>
      </span>
    );
  }
  