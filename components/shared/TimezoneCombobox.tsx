"use client";

import { useState, useMemo } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { prioritizeTimezones } from "@/lib/utils/timezone";

interface TimezoneComboboxProps {
  value: string;
  onChange: (tz: string) => void;
}

export function TimezoneCombobox({ value, onChange }: TimezoneComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const allTimezones = useMemo(() => Intl.supportedValuesOf("timeZone"), []);

  // Prioritized default list — only re-computes when the selected value changes.
  const defaultTimezones = useMemo(
    () => prioritizeTimezones(value, allTimezones),
    [value, allTimezones]
  );

  // Search filtering — only re-computes when the user types.
  // Falls back to the prioritized default list when search is empty.
  const visibleTimezones = useMemo(() => {
    if (!search) return defaultTimezones;
    const normalizedSearch = search.replace(/_/g, " ").toLowerCase();
    return allTimezones.filter((tz) =>
      tz.replace(/_/g, " ").toLowerCase().includes(normalizedSearch)
    );
  }, [search, allTimezones, defaultTimezones]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value ? value.replace(/_/g, " ") : "Select timezone..."}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search timezone..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No timezone found.</CommandEmpty>
            <CommandGroup>
              {visibleTimezones.map((tz) => (
                <CommandItem
                  key={tz}
                  value={tz}
                  onSelect={() => {
                    onChange(tz);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      value === tz ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {tz.replace(/_/g, " ")}
                </CommandItem>
              ))}
            </CommandGroup>
            {!search && allTimezones.length > visibleTimezones.length && !visibleTimezones.includes(value) && (
              <p className="py-2 text-center text-xs text-muted-foreground">
                Type to search all {allTimezones.length} timezones
              </p>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
