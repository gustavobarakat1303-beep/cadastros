import { forwardRef } from 'react'

const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    className = '',
    accentColor,
    ...props
  },
  ref
) {
  const focusStyle = accentColor
    ? { '--tw-ring-color': accentColor }
    : {}

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`input ${error ? 'border-red-400 focus:ring-red-400' : ''} ${className}`}
        style={focusStyle}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs text-gray-400">{hint}</p>
      )}
    </div>
  )
})

export default Input
