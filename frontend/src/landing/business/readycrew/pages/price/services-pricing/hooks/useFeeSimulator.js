import { useCallback, useMemo, useState } from 'react';
import { PRICING_CONFIG, SIMULATOR_FIELD_KEYS } from '../lib/pricingConfig';
import { calculate } from '../lib/pricingModel';
import { createFormatters } from '../lib/format';

const RESULT_KEYS = ['direct', 'managed', 'partner'];

const toFormValues = (defaults) =>
  Object.fromEntries(Object.entries(defaults).map(([key, value]) => [key, String(value)]));

export function useFeeSimulator(copy, lang) {
  const [values, setValues] = useState(() => toFormValues(PRICING_CONFIG.defaults));
  const [copyStatus, setCopyStatus] = useState('');

  const result = useMemo(() => calculate(values), [values]);
  const { n, yen } = useMemo(() => createFormatters(lang), [lang]);

  const setField = useCallback((key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setCopyStatus('');
  }, []);

  const reset = useCallback(() => {
    setValues(toFormValues(PRICING_CONFIG.defaults));
    setCopyStatus('');
  }, []);

  const copyResult = useCallback(async () => {
    if (result.errors) return;
    const lines = [
      copy.resultSummary,
      ...SIMULATOR_FIELD_KEYS.map(
        (key) => `${copy[key]}: ${key === 'level' ? copy.levels[result.state[key]] : n(result.state[key])}`,
      ),
      ...RESULT_KEYS.map((key, i) => {
        const { min, max } = result[key];
        return `${copy.services[i].name}: ${yen(min)}${max !== min ? ` – ${yen(max)}` : ''}`;
      }),
      copy.referenceNote,
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopyStatus(copy.copied);
    } catch {
      setCopyStatus(copy.copyFail);
    }
  }, [copy, n, result, yen]);

  const errors = result.errors || [];

  return {
    values,
    setField,
    reset,
    result,
    errors,
    hasErrors: errors.length > 0,
    copyResult,
    copyStatus,
    n,
    yen,
  };
}
