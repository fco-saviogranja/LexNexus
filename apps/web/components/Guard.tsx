"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthUser, getUser } from "../src/lib/auth";

export function Guard({
  children,
  requireAdmin = false
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.replace("/login");
      return;
    }
    if (requireAdmin && user.role !== "admin") {
      router.replace("/app");
    }
  }, [requireAdmin, router]);

  return <>{children}</>;
}

export function useCurrentUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }
  return getUser();
}
