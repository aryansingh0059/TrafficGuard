import React from 'react';

const GovInputField = ({
  id,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  autoComplete,
  rightElement,
}) => (
  <div className="mb-5 relative">
    <label htmlFor={id} className="gov-form-label">
      {label}
    </label>
    <div className="relative">
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`gov-form-input ${error ? 'error' : ''}`}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {rightElement && (
        <div className="absolute inset-y-0 right-3 flex items-center">
          {rightElement}
        </div>
      )}
    </div>
    {error && (
      <p id={`${id}-error`} className="gov-form-error" role="alert">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        {error}
      </p>
    )}
  </div>
);

export default GovInputField;
