import * as React from "react";

import { cn } from "@/lib/utils";

type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "danger";
};

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(({ className, variant = "default", ...props }, ref) => {
  const variantClass =
    variant === "danger"
      ? "border-danger/30 bg-danger/10 text-danger"
      : "border-input bg-muted/60 text-foreground";

  return <div ref={ref} role="alert" className={cn("rounded-md border p-3 text-sm", variantClass, className)} {...props} />;
});

Alert.displayName = "Alert";

export { Alert };
