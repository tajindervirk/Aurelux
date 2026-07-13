/**
 * Parse a dynamic provider URL template from the database.
 * Supports placeholders: {id}, {s} (season), {e} (episode), {ep} (anime episode), {subDub}
 */
export const parseProviderUrl = (template, params = {}) => {
  if (!template) return '';
  return template
    .replace('{id}', params.id || '')
    .replace('{s}', params.s || 1)
    .replace('{e}', params.e || 1)
    .replace('{ep}', params.ep || 1)
    .replace('{subDub}', params.subDub || 'sub');
};
