import { useEffect } from "react";
import { BRAND_NAME } from "@/config/brand";

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | ${BRAND_NAME}`;
  }, [title]);
}
