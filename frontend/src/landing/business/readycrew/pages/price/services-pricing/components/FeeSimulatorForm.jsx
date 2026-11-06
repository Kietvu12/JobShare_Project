const NUMBER_FIELDS = {
  headcount: { min: 1, max: 500 },
  income: { min: 1, max: 100000000 },
  budget: { min: 0, max: 100000000000 },
  opens: { min: 1, max: 999 },
  partner: { min: 1, max: 100000000 },
};

function NumberField({ name, label, unit, hint, value, invalid, onChange }) {
  const { min, max } = NUMBER_FIELDS[name];
  const hintId = `${name}-hint`;
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <div className="input-wrap">
        <input
          id={name}
          name={name}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step="1"
          required
          value={value}
          aria-invalid={invalid ? 'true' : 'false'}
          aria-describedby={hint ? hintId : undefined}
          onChange={(event) => onChange(name, event.target.value)}
        />
        <span>{unit}</span>
      </div>
      <small id={hintId}>{hint}</small>
    </div>
  );
}

export default function FeeSimulatorForm({ copy, simulator }) {
  const { values, setField, reset, errors, hasErrors } = simulator;
  const fieldProps = (name) => ({
    name,
    label: copy[name],
    value: values[name],
    invalid: errors.includes(name),
    onChange: setField,
  });

  return (
    <form id="fee-form" noValidate onSubmit={(event) => event.preventDefault()}>
      <div className="panel-head">
        <h3>{copy.inputTitle}</h3>
        <button type="button" className="text-button" onClick={reset}>
          {copy.reset} ↺
        </button>
      </div>

      <div className="primary-fields">
        <NumberField {...fieldProps('headcount')} unit={copy.people} />
        <NumberField {...fieldProps('income')} unit="JPY" />
        <NumberField {...fieldProps('budget')} unit="JPY" hint={copy.budgetHint} />
        <div className="field">
          <label htmlFor="level">{copy.level}</label>
          <select
            id="level"
            name="level"
            value={values.level}
            aria-invalid={errors.includes('level') ? 'true' : 'false'}
            onChange={(event) => setField('level', event.target.value)}
          >
            {Object.entries(copy.levels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <details className="advanced">
        <summary>{copy.advanced}</summary>
        <div className="advanced-fields">
          <NumberField {...fieldProps('opens')} unit={copy.profiles} hint={copy.opensHint} />
          <NumberField {...fieldProps('partner')} unit="JPY" hint={copy.partnerHint} />
        </div>
        <div className="assumptions">
          <strong>{copy.assumptions}</strong>
          <p>{copy.rateLabels.join(' · ')}</p>
          <p>{copy.platformAssumption}</p>
        </div>
      </details>

      {hasErrors ? (
        <p id="form-error" role="alert">
          {copy.errorTitle} {copy.errorText}
        </p>
      ) : null}
    </form>
  );
}
