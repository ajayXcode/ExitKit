// Small JSON Schema subset validator (type, required, properties, items, enum, $ref, minItems).
export function validate(schema, data, root = schema, at = '$') {
  const errs = [];
  if (schema.$ref) {
    const target = schema.$ref.replace('#/', '').split('/').reduce((o, k) => o?.[k], root);
    if (!target) return [`${at}: unresolved ${schema.$ref}`];
    return validate(target, data, root, at);
  }
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const actual = data === null ? 'null' : Array.isArray(data) ? 'array' : Number.isInteger(data) ? 'integer' : typeof data;
    const ok = types.some((t) => t === actual || (t === 'number' && actual === 'integer'));
    if (!ok) return [`${at}: expected ${types.join('|')}, got ${actual}`];
  }
  if (schema.enum && !schema.enum.includes(data)) errs.push(`${at}: must be one of ${schema.enum.join(', ')}`);
  if (schema.type === 'object' || schema.properties || schema.required) {
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      for (const r of schema.required || []) if (!(r in data)) errs.push(`${at}: missing required "${r}"`);
      for (const [k, s] of Object.entries(schema.properties || {})) if (k in data) errs.push(...validate(s, data[k], root, `${at}.${k}`));
    }
  }
  if (Array.isArray(data) && schema.items) {
    if (schema.minItems && data.length < schema.minItems) errs.push(`${at}: needs at least ${schema.minItems} item(s)`);
    data.forEach((d, i) => errs.push(...validate(schema.items, d, root, `${at}[${i}]`)));
  }
  return errs;
}
