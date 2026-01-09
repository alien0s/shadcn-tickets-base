import { useState } from "react";

export function useTwoFactor() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  return {
    twoFactorEnabled,
    setTwoFactorEnabled,
  };
}
