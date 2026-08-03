import React from 'react';

/** Khối label + icon cho form lọc (Agent jobs / Scout candidates). */
const FilterBlock = ({
  icon: Icon,
  label,
  children,
  helperText,
  compact = false,
}) => (
  <div className={`flex gap-1 min-w-0 items-start${compact ? '' : ''}`}>
    <div className="flex-shrink-0 leading-none">
      <Icon className="w-3 h-3 text-gray-600" />
    </div>
    <div className="flex-1 space-y-0.5 min-w-0">
      <label className="text-[9px] font-medium text-gray-700 block h-3 leading-3">{label}</label>
      {children}
      {helperText ? (
        <p className="text-[9px] text-gray-500">{helperText}</p>
      ) : null}
    </div>
  </div>
);

export default FilterBlock;
