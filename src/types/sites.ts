export interface SiteShortcut {
  id: string;
  name: string;
  url: string;
  hostname: string;
  addedAt: string;
  order: number;
}

export interface SiteHistoryResult {
  url: string;
  sourceUrl: string;
  hostname: string;
  title: string;
  lastVisitTime?: number;
  visitCount?: number;
}

export type AddSiteFailureReason = "invalid-url" | "duplicate" | "limit";

export type AddSiteResult =
  | {
      ok: true;
      item: SiteShortcut;
    }
  | {
      ok: false;
      reason: AddSiteFailureReason;
    };
