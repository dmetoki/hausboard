import { Header } from "@/components/layout/header";
import { OrgProvider } from "@/context/org-context";
import { FiltersProvider } from "@/context/filters-context";
import { SettingsProvider } from "@/context/settings-context";
import { getUserSettings } from "@/lib/settings";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getUserSettings();

  return (
    <FiltersProvider initialFilters={settings?.date_range}>
      <SettingsProvider settings={settings}>
        <OrgProvider>
          <Header />
          {children}
        </OrgProvider>
      </SettingsProvider>
    </FiltersProvider>
  );
}
