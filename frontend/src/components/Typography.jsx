import React from 'react';

export const PageTitle = ({ children, className = '' }) => (
  <h1 className={`text-[24px] font-semibold text-primary ${className}`}>
    {children}
  </h1>
);

export const SectionTitle = ({ children, className = '' }) => (
  <h2 className={`text-[18px] font-semibold text-primary ${className}`}>
    {children}
  </h2>
);

export const Label = ({ children, className = '' }) => (
  <label className={`text-[13px] font-medium text-gray-600 ${className}`}>
    {children}
  </label>
);

export const Value = ({ children, className = '' }) => (
  <span className={`text-[15px] font-normal text-gray-900 ${className}`}>
    {children}
  </span>
);
