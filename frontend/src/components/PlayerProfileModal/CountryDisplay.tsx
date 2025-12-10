/**
 * CountryDisplay - Renders country flag and name
 */

const COUNTRIES: Record<string, { flag: string; name: string }> = {
  US: { flag: '🇺🇸', name: 'United States' },
  CA: { flag: '🇨🇦', name: 'Canada' },
  GB: { flag: '🇬🇧', name: 'United Kingdom' },
  FR: { flag: '🇫🇷', name: 'France' },
  DE: { flag: '🇩🇪', name: 'Germany' },
  ES: { flag: '🇪🇸', name: 'Spain' },
  IT: { flag: '🇮🇹', name: 'Italy' },
  JP: { flag: '🇯🇵', name: 'Japan' },
  AU: { flag: '🇦🇺', name: 'Australia' },
  BR: { flag: '🇧🇷', name: 'Brazil' },
  MX: { flag: '🇲🇽', name: 'Mexico' },
  IN: { flag: '🇮🇳', name: 'India' },
  CN: { flag: '🇨🇳', name: 'China' },
  KR: { flag: '🇰🇷', name: 'South Korea' },
};

interface CountryDisplayProps {
  countryCode: string;
}

export function CountryDisplay({ countryCode }: CountryDisplayProps) {
  const country = COUNTRIES[countryCode];

  if (!country) {
    return <span>{countryCode}</span>;
  }

  return (
    <>
      <span aria-hidden="true">{country.flag}</span> {country.name}
    </>
  );
}
