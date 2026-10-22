import { StaffShell } from "@/components/staff-shell";
import { isAdmin } from "@/lib/admin-auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) return children;
  return <StaffShell>{children}</StaffShell>;
}
