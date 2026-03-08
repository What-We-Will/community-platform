"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScheduleRow {
  id: string;
  name: string;
  days: string;
  time: string;
  position: number;
}

interface Props {
  rows: ScheduleRow[];
  isPlatformAdmin: boolean;
}

export function WeeklyScheduleCard({ rows, isPlatformAdmin }: Props) {
  const [open, setOpen] = useState(false);

  // Lazy-load the admin component only when needed
  const [AdminComponent, setAdminComponent] = useState<React.ComponentType<{ rows: ScheduleRow[] }> | null>(null);

  async function handleOpen() {
    if (!open && isPlatformAdmin && !AdminComponent) {
      const mod = await import("./WeeklyScheduleAdmin");
      setAdminComponent(() => mod.WeeklyScheduleAdmin);
    }
    setOpen((o) => !o);
  }

  return (
    <Card className="col-span-full">
      <CardHeader
        className="pb-3 cursor-pointer select-none"
        onClick={handleOpen}
      >
        <CardTitle className="flex items-center justify-between text-base font-semibold">
          <span className="flex items-center gap-2">
            <CalendarDays className="size-4 text-muted-foreground" />
            Weekly Schedule
          </span>
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </CardTitle>
      </CardHeader>

      {open && (
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Days</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Time</th>
                  {isPlatformAdmin && <th className="w-20" />}
                </tr>
              </thead>
              {isPlatformAdmin && AdminComponent ? (
                <AdminComponent rows={rows} />
              ) : (
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={row.id} className={i % 2 === 0 ? "border-b" : "border-b bg-muted/20"}>
                      <td className="px-4 py-2.5 font-medium">{row.name}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{row.days}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{row.time}</td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
