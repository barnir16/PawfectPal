/**
 * Localizes a service type name coming straight from the backend catalog
 * (ServiceTypeORM.name — a free-text column an admin can add rows to, e.g.
 * "walking", "Training") using the existing services.<type> locale keys.
 *
 * This is an explicit whitelist rather than a blind `services.${name}`
 * lookup: DB rows aren't guaranteed to match the locale key naming
 * convention exactly (casing already drifts — "walking" vs "Training" in
 * the seed data), and a silent miss here just falls back to the raw
 * English name with no visible error, which is easy to miss. Keeping one
 * explicit map means a new/renamed service type shows up in code review as
 * "needs a locale key," instead of quietly rendering untranslated.
 */
const KNOWN_SERVICE_TYPE_KEYS: Record<string, string> = {
  walking: 'services.walking',
  sitting: 'services.sitting',
  boarding: 'services.boarding',
  grooming: 'services.grooming',
  veterinary: 'services.veterinary',
  training: 'services.training',
  pettaxi: 'services.petTaxi',
  daycare: 'services.daycare',
};

export function getServiceTypeLabel(t: (key: string) => string, rawName: string): string {
  if (!rawName) {
    return rawName;
  }

  const key = KNOWN_SERVICE_TYPE_KEYS[rawName.toLowerCase()];
  return key ? t(key) : rawName;
}
