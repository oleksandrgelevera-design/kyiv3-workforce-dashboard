"use client";

import { useRouter } from "next/navigation";
import WorkforceApp from "@/components/WorkforceApp";
import type { Store, Vacancy, Settings } from "@/lib/types";

export default function DashboardClient(props: {
  initialStores: Store[];
  initialVacancies: Vacancy[];
  initialSettings: Settings;
  userEmail: string;
}) {
  const router = useRouter();

  return (
    <WorkforceApp
      {...props}
      onSignOut={() => {
        router.push("/login");
        router.refresh();
      }}
    />
  );
}
