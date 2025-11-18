// Alias page to expose the main dashboard also at /dashboard
// This re-uses the existing implementation from the (dashboard) route group (which renders at /)
import DashboardRootPage from "../(dashboard)/page";

export default async function DashboardAliasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  return <DashboardRootPage searchParams={searchParams} />;
}
