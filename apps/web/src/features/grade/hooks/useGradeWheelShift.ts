import { useCallback, useRef, type WheelEvent } from "react";
import { type ShiftKey } from "../types";

type UseGradeWheelShiftParams = {
  shift: ShiftKey;
  onShiftChange: (value: ShiftKey) => void;
};

export function useGradeWheelShift({ shift, onShiftChange }: UseGradeWheelShiftParams) {
  const lastWheelSwitchRef = useRef<number>(0);

  const handleWheelShift = useCallback(
    (event: WheelEvent<HTMLElement>) => {
      const now = Date.now();
      if (now - lastWheelSwitchRef.current < 240) return;
      if (Math.abs(event.deltaY) < 10) return;

      if (event.deltaY > 0 && shift !== "V") {
        onShiftChange("V");
        lastWheelSwitchRef.current = now;
      } else if (event.deltaY < 0 && shift !== "M") {
        onShiftChange("M");
        lastWheelSwitchRef.current = now;
      }
    },
    [onShiftChange, shift]
  );

  return { handleWheelShift };
}


