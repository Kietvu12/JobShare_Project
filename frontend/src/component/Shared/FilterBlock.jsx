import React from 'react';

/** Khối label + icon cho form lọc (Agent jobs / Scout candidates). */
const FilterBlock = ({
  icon: Icon,
  label,
  children,
  helperText,
  compact = false,
  labelClassName = '',
  fieldMinHeightClass = 'min-h-[26px]',
}) => {
  const labelCls = labelClassName || 'text-[9px] font-medium leading-none text-gray-700';

  if (compact) {
    return (
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex min-h-[12px] items-center gap-1">
          <Icon className="h-3.5 w-3.5 shrink-0 text-gray-600" />
          <span className={`truncate ${labelCls}`}>{label}</span>
        </div>
        <div className={fieldMinHeightClass}>{children}</div>
        {helperText ? (
          <p className="text-[9px] text-gray-500">{helperText}</p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex min-w-0 items-start gap-1">
      <div className="shrink-0 leading-none">
        <Icon className="h-3.5 w-3.5 text-gray-600" />
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <label className={`block ${labelCls}`}>{label}</label>
        {children}
        {helperText ? (
          <p className="text-[9px] text-gray-500">{helperText}</p>
        ) : null}
      </div>
    </div>
  )
};

export default FilterBlock;
