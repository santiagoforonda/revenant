import * as React from "react"

import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type AuthLabelProps = React.ComponentProps<typeof Label>

function AuthLabel({ className, ...props }: AuthLabelProps) {
  return (
    <Label
      className={cn(
        "text-[#E1DCC9] font-medium font-sans mb-2",
        className
      )}
      {...props}
    />
  )
}

export { AuthLabel }
export type { AuthLabelProps }
