"use client";

import { useCallback, useEffect, useState } from "react";
import { suspensionesService } from "@/services/suspensiones.service";
import type { SuspensionEntityType, SuspensionPayload, SuspensionSummary } from "@/types/catalogs";

export function useSuspensions(type: SuspensionEntityType) {
  const [active, setActive] = useState<Record<number, SuspensionSummary>>({});
  const refresh = useCallback(async () => setActive(await suspensionesService.active(type)), [type]);
  useEffect(() => {
    let mounted = true;
    void suspensionesService.active(type).then((data) => { if (mounted) setActive(data); });
    return () => { mounted = false; };
  }, [type]);
  const suspend = async (id: number, payload: SuspensionPayload) => {
    await suspensionesService.suspend(type, id, payload);
    await refresh();
  };
  const resume = async (id: number) => {
    await suspensionesService.resume(type, id);
    await refresh();
  };
  return { active, refresh, suspend, resume };
}
