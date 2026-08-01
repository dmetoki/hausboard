"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useOrganization, useOrganizationList } from "@clerk/nextjs";

type Org = {
  id: string;
  name: string;
  imageUrl: string;
};

type OrgContextValue = {
  selectedOrg: Org | null;
  setSelectedOrg: (org: Org) => void;
  orgs: Org[];
  loading: boolean;
};

const OrgContext = createContext<OrgContextValue | undefined>(undefined);

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrg must be used within an OrgProvider");
  return ctx;
}

export function OrgProvider({ children }: { children: ReactNode }) {
  // Only set when the user explicitly picks a different org (optimistic UI
  // for the gap between calling setActive and Clerk's `organization` catching
  // up). Clerk's own `organization` always wins once it reflects a value, so
  // this can't go stale if the active org changes from elsewhere.
  const [overrideOrgId, setOverrideOrgId] = useState<string | null>(null);

  const { organization, isLoaded: isOrgLoaded } = useOrganization();
  const {
    isLoaded: isListLoaded,
    userMemberships,
    setActive,
  } = useOrganizationList({ userMemberships: { infinite: true } });

  const isLoaded = isOrgLoaded && isListLoaded;

  const orgs = useMemo<Org[]>(() => {
    if (!userMemberships.data) return [];
    return userMemberships.data.map((membership) => ({
      id: membership.organization.id,
      name: membership.organization.name,
      imageUrl: membership.organization.imageUrl,
    }));
  }, [userMemberships.data]);

  const selectedOrgId = organization?.id ?? overrideOrgId ?? orgs[0]?.id ?? null;

  const selectedOrg = useMemo(
    () => orgs.find((org) => org.id === selectedOrgId) ?? null,
    [orgs, selectedOrgId],
  );

  // Auto-activate the first org when the user has orgs but none active in
  // Clerk yet. This only calls out to Clerk (an external system) — it never
  // sets local state, so it doesn't trigger a setState-in-effect cascade.
  useEffect(() => {
    if (!isLoaded || organization || orgs.length === 0) return;
    setActive?.({ organization: orgs[0].id }).catch(console.error);
  }, [isLoaded, organization, orgs, setActive]);

  const selectOrg = useCallback(
    async (org: Org) => {
      setOverrideOrgId(org.id);
      try {
        await setActive?.({ organization: org.id });
      } catch (error) {
        console.error("Error setting active organization:", error);
      }
    },
    [setActive],
  );

  const value = useMemo(
    () => ({
      selectedOrg,
      setSelectedOrg: selectOrg,
      orgs,
      loading: !isLoaded,
    }),
    [selectedOrg, selectOrg, orgs, isLoaded],
  );

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}
