import Constants from 'expo-constants';

import { APP_CHANGELOG_MD } from './appChangelogData';

export interface ChangelogSection {
  version: string;
  bullets: string[];
}

/** Parse changelog markdown (`## x.y.z` + `- bullet` lines). */
export function parseAppChangelog(source: string = APP_CHANGELOG_MD): ChangelogSection[] {
  const sections: ChangelogSection[] = [];
  let current: ChangelogSection | null = null;

  for (const raw of source.split(/\r?\n/)) {
    const line = raw.trim();
    const heading = line.match(/^##\s+([0-9]+\.[0-9]+\.[0-9]+)/);
    if (heading) {
      current = { version: heading[1]!, bullets: [] };
      sections.push(current);
      continue;
    }
    if (current && line.startsWith('- ')) {
      current.bullets.push(line.slice(2).trim());
    }
  }

  return sections;
}

export function currentAppVersion(): string {
  return Constants.expoConfig?.version ?? '1.0.0';
}

export function changelogForVersion(version: string): ChangelogSection | null {
  return parseAppChangelog().find((section) => section.version === version) ?? null;
}
