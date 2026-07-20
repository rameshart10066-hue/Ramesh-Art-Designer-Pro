import type { MaterialProfile } from "@ramesh/api-contracts";

interface MaterialProfileSelectProps {
  profiles: MaterialProfile[];
  value: string;
  onChange: (materialProfileId: string) => void;
}

export function MaterialProfileSelect({ profiles, value, onChange }: MaterialProfileSelectProps) {
  return (
    <label>
      Material
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label="Material profile">
        {profiles.map((profile) => (
          <option key={profile.id} value={profile.id}>
            {profile.name} (kerf {profile.kerfMm}mm)
          </option>
        ))}
      </select>
    </label>
  );
}
