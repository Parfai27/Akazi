import type { Metadata } from "next";
import { StaffShell } from "@/components/staff-shell";
import { isAdmin } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Staff",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) return children;
  return <StaffShell>{children}</StaffShell>;
}
