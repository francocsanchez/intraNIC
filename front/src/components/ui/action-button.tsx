import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "./button";

type ActionButtonProps = ButtonProps;

function ActionButton({ className, size = "sm", type = "button", ...props }: ActionButtonProps) {
  return <Button type={type} size={size} className={cn("font-semibold", className)} {...props} />;
}

function EditActionButton({ className, size = "sm", type = "button", ...props }: ActionButtonProps) {
  return (
    <Button
      type={type}
      variant="outline"
      size={size}
      className={cn("font-semibold text-foreground", className)}
      {...props}
    />
  );
}

function DeleteActionButton({ className, size = "sm", type = "button", ...props }: ActionButtonProps) {
  return (
    <Button
      type={type}
      variant="destructive"
      size={size}
      className={cn("font-semibold", className)}
      {...props}
    />
  );
}

export { ActionButton, DeleteActionButton, EditActionButton };
