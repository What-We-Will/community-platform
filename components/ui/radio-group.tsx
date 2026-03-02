"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const RadioGroupContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
  name: string;
} | null>(null);

function RadioGroup({
  value,
  onValueChange,
  name,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  value?: string;
  onValueChange?: (value: string) => void;
  name?: string;
}) {
  const [internalValue, setInternalValue] = React.useState(value ?? "");
  const currentValue = value !== undefined ? value : internalValue;
  const handleChange = React.useCallback(
    (v: string) => {
      if (value === undefined) setInternalValue(v);
      onValueChange?.(v);
    },
    [value, onValueChange]
  );
  const id = React.useId();
  return (
    <RadioGroupContext.Provider
      value={{
        value: currentValue,
        onValueChange: handleChange,
        name: name ?? id,
      }}
    >
      <div
        role="radiogroup"
        className={cn("grid gap-2", className)}
        {...props}
      >
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

function RadioGroupItem({
  value,
  id,
  className,
  children,
}: React.ComponentProps<"div"> & { value: string }) {
  const context = React.useContext(RadioGroupContext);
  if (!context) return null;
  const { value: selectedValue, onValueChange, name } = context;
  const checked = selectedValue === value;
  const inputId = id ?? `${name}-${value}`;
  return (
    <div className="flex items-center gap-2">
      <input
        type="radio"
        name={name}
        id={inputId}
        value={value}
        checked={checked}
        onChange={() => onValueChange(value)}
        className={cn(
          "size-4 shrink-0 rounded-full border border-primary text-primary shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      />
      <label
        htmlFor={inputId}
        className="flex-1 cursor-pointer text-sm font-normal leading-none"
      >
        {children}
      </label>
    </div>
  );
}

export { RadioGroup, RadioGroupItem };
