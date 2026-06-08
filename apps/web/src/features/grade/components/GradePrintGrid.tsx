import { getSubjectColorClasses } from "@/lib/subject-colors";
import { cn } from "@/lib/utils";
import { type BreakMarker, type ShiftEvent, type WeekDay, WEEK_DAYS } from "../types";

const DAY_LABELS: Record<WeekDay, string> = {
  seg: "Seg",
  ter: "Ter",
  qua: "Qua",
  qui: "Qui",
  sex: "Sex",
};

type GradePrintGridProps = {
  times: readonly string[];
  events: readonly ShiftEvent[];
  breakMarkers?: readonly BreakMarker[];
};

export function GradePrintGrid({ times, events, breakMarkers = [] }: GradePrintGridProps) {
  const eventBySlot = new Map(events.map((event) => [`${event.day}-${event.time}`, event]));
  const breakLabelByAnchorTime = new Map(
    breakMarkers
      .filter((marker) => marker.anchorTime && marker.labelTime)
      .map((marker) => [marker.anchorTime, marker.labelTime])
  );

  return (
    <div data-grade-print-static-grid aria-hidden="true">
      <table className="w-full table-fixed border-collapse rounded-lg border border-border text-foreground">
        <thead>
          <tr>
            <th className="w-14 border-b border-r border-border px-2 py-2 text-left" />
            {WEEK_DAYS.map((day) => (
              <th
                key={day}
                className="border-b border-r border-border px-2 py-2 text-center text-sm font-semibold last:border-r-0"
              >
                {DAY_LABELS[day]}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {times.map((time) => (
            <tr key={time}>
              <th className="relative h-20 border-b border-r border-border px-2 text-left text-sm font-semibold text-foreground/80">
                {time}
                {breakLabelByAnchorTime.has(time) ? (
                  <span className="absolute bottom-0 left-1/2 inline-flex -translate-x-1/2 translate-y-1/2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {breakLabelByAnchorTime.get(time)}
                  </span>
                ) : null}
              </th>

              {WEEK_DAYS.map((day) => {
                const event = eventBySlot.get(`${day}-${time}`);
                const tone = event ? getSubjectColorClasses(event.subject) : null;

                return (
                  <td
                    key={`${day}-${time}`}
                    className="h-20 border-b border-r border-border p-1.5 align-top last:border-r-0"
                  >
                    {event && tone ? (
                      <div
                        className={cn(
                          "flex h-full min-w-0 flex-col justify-center rounded-md border px-2 py-1",
                          tone.border,
                          tone.background,
                          tone.text
                        )}
                      >
                        <div className="truncate text-sm font-semibold leading-tight">
                          {event.className}
                        </div>
                        <div className="truncate text-xs font-medium leading-tight opacity-90">
                          {event.subject}
                        </div>
                      </div>
                    ) : null}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
