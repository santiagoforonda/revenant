import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

const maxWidthMap: Record<NonNullable<AuthCardProps["maxWidth"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export function AuthCard({ children, className, maxWidth }: AuthCardProps) {
  return (
    <Card
      className={cn(
        "border-[#412D15] bg-[#1F150C] shadow-[inset_0_0_8px_rgba(0,0,0,0.5)]",
        maxWidth && maxWidthMap[maxWidth],
        className
      )}
    >
      {children}
    </Card>
  );
}
