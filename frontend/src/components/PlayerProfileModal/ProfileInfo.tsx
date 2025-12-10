/**
 * ProfileInfo - Bio, Country, and Favorite Team display
 */

import { UICard } from '../ui/UICard';
import { CountryDisplay } from './CountryDisplay';
import type { ProfileInfoProps } from './types';

export function ProfileInfo({ profile }: ProfileInfoProps) {
  const hasCountry = !!profile.country;
  const hasFavoriteTeam = !!profile.favorite_team;

  if (!profile.bio && !hasCountry && !hasFavoriteTeam) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Bio */}
      {profile.bio && (
        <UICard variant="bordered" size="sm">
          <div className="text-xs font-semibold text-skin-muted mb-1">BIO</div>
          <p className="text-sm text-skin-secondary">{profile.bio}</p>
        </UICard>
      )}

      {/* Country and Favorite Team */}
      {(hasCountry || hasFavoriteTeam) && (
        <div className="flex gap-3">
          {hasCountry && (
            <UICard variant="bordered" size="sm" className="flex-1">
              <div className="text-xs font-semibold text-skin-muted mb-1">COUNTRY</div>
              <div className="text-sm text-skin-secondary">
                <CountryDisplay countryCode={profile.country!} />
              </div>
            </UICard>
          )}
          {hasFavoriteTeam && (
            <UICard variant="bordered" size="sm" className="flex-1">
              <div className="text-xs font-semibold text-skin-muted mb-1">FAVORITE TEAM</div>
              <div
                className={`text-sm font-semibold ${profile.favorite_team === 1 ? 'text-team1' : 'text-team2'}`}
              >
                Team {profile.favorite_team}
              </div>
            </UICard>
          )}
        </div>
      )}
    </div>
  );
}
