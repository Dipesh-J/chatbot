export function validateCSV(parsed) {
  const errors = [];

  if (!parsed.data || parsed.data.length === 0) {
    errors.push('CSV file is empty');
    return { valid: false, errors };
  }

  if (!parsed.meta?.fields || parsed.meta.fields.length === 0) {
    errors.push('CSV file has no headers');
    return { valid: false, errors };
  }

  if (parsed.data.length > 10000) {
    errors.push('CSV file exceeds 10,000 row limit');
    return { valid: false, errors };
  }

  if (parsed.errors && parsed.errors.length > 0) {
    const criticalErrors = parsed.errors.filter((e) => e.type === 'Delimiter' || e.type === 'FieldMismatch');
    if (criticalErrors.length > 10) {
      errors.push(`Too many parsing errors (${criticalErrors.length})`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function inferColumnTypes(rows, fields) {
  return fields.map((name) => {
    const sample = rows.slice(0, 50).map((r) => r[name]).filter(Boolean);

    const isNumber = sample.length > 0 && sample.every((v) => !isNaN(parseFloat(v)));
    if (isNumber) return { name, type: 'number' };

    const isDate = sample.length > 0 && sample.every((v) => !isNaN(Date.parse(v)));
    if (isDate) return { name, type: 'date' };

    return { name, type: 'string' };
  });
}
