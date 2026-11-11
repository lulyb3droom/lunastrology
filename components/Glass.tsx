import type { ElementType, ReactNode } from "react";

type Variant = "default" | "strong" | "subtle";

const CLASS: Record<Variant, string> = {
  default: "glass",
  strong: "glass-strong",
  subtle: "glass-subtle",
};

// Componente reutilizável do efeito de vidro fosco.
// Regra: não colocar um <Glass> dentro de outro (pesa no celular).
export function Glass({
  variant = "default",
  as,
  className = "",
  children,
}: {
  variant?: Variant;
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  const Tag = as ?? "div";
  return <Tag className={`${CLASS[variant]} ${className}`}>{children}</Tag>;
}
