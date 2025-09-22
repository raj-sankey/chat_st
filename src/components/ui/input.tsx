import * as React from "react";
import { cn } from "@/lib/utils";
import Icon from "../Icons/Icon";

type CommonProps = {
  variant?: "default" | "outlined" | "filled" | "chat";
  iconLeft?: string;
  iconRight?: string;
  width?: string;
  height?: string;
  onIconClickLeft?: React.MouseEventHandler<HTMLDivElement>;
  onIconClickRight?: React.MouseEventHandler<HTMLDivElement>;
  className?: string;
  type: string;
  iconWidth?: number | string;
  iconHeight?: number | string;
};

type InputProps = CommonProps &
  React.InputHTMLAttributes<HTMLInputElement> & {
    as?: "input";
  };

type TextareaProps = CommonProps &
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    as?: "textarea";
  };

type Props = InputProps | TextareaProps;

const Input = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, Props>(
  (
    {
      className,
      variant = "default",
      iconLeft,
      iconRight,
      iconHeight,
      iconWidth,
      type = "text",
      width = "100%",
      height = "auto",
      onChange,
      onIconClickLeft,
      onIconClickRight,
      as,
      ...props
    },
    ref
  ) => {
    const paddingLeft = iconLeft ? "pl-14" : "pl-3";
    const paddingRight = iconRight ? "pr-10" : "pr-3";

    // Conditional rendering for textarea in chat variant
    const isChatVariant = variant === "chat" || as === "textarea";
    const InputElement = isChatVariant ? "textarea" : "input";

    return (
      <div className={cn("relative", className)}>
        {InputElement === "input" ? (
          <input
            ref={ref as React.Ref<HTMLInputElement>}
            type={type}
            data-slot="input"
            style={{ width, height }}
            className={cn(
              "file:text-foreground placeholder:text-muted-foreground placeholder:text-[14px] selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
              {
                "focus-visible:border-blue-500 focus-visible:ring-0":
                  variant === "default",
                "border-solid border-[1px]": variant === "outlined",
                "bg-muted": variant === "filled",
              },
              paddingLeft,
              paddingRight,
              "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
            )}
            onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
            {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
          />
        ) : (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            data-slot="input"
            style={{ width, height }}
            className={cn(
              "file:text-foreground placeholder:text-muted-foreground placeholder:text-[14px] selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
              {
                "focus-visible:border-blue-500 focus-visible:ring-0":
                  variant === "default",
                "border-solid border-[1px]": variant === "outlined",
                "bg-muted": variant === "filled",
                "resize-none": true,
                "overflow-y-auto": true,
                "h-auto min-h-[50px] max-h-[150px]": true,
              },
              paddingLeft,
              paddingRight,
              "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
            )}
            onChange={onChange as React.ChangeEventHandler<HTMLTextAreaElement>}
            {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        )}
        {iconLeft && (
          <div
            className={cn(
              "absolute top-1/2 transform -translate-y-1/2 cursor-pointer left-3"
            )}
            onClick={onIconClickLeft}
          >
            <Icon
              name={iconLeft}
              width={iconWidth}
              height={iconHeight}
              color="red"
            />
          </div>
        )}
        {iconRight && (
          <div
            className={cn(
              "absolute top-1/2 transform -translate-y-1/2 cursor-pointer right-3"
            )}
            onClick={onIconClickRight}
          >
            <Icon
              name={iconRight}
              width={iconWidth}
              height={iconHeight}
              color="red"
            />
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
