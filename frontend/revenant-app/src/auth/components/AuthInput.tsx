import * as React from "react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type AuthInputProps = React.ComponentProps<typeof Input>

function AuthInput({ className, ...props }: AuthInputProps) {
  return (
    <Input
      className={cn(
        "bg-[var(--revenant-primary)] border-[var(--revenant-accent)] text-[var(--revenant-highlight)] placeholder:text-[var(--revenant-highlight)]/50 focus-visible:border-[var(--revenant-highlight)] focus-visible:ring-[var(--revenant-highlight)]/50",
        className
      )}
      {...props}
    />
  )
}

export { AuthInput }
export type { AuthInputProps }
