// src/components/ui/form/Select.tsx
import React from "react";

/** ✅ Exported option type (used across app) */
export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  defaultValue?: string;
  name?: string;
  disabled?: boolean; // ✅ REQUIRED for AssignClass
}

const Select: React.FC<SelectProps> = ({
  options,
  value,
  placeholder = "Select an option",
  onChange,
  className = "",
  defaultValue = "",
  name,
  disabled = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <select
      name={name}
      disabled={disabled}
      className={`h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 ${
        value
          ? "text-gray-800 dark:text-white/90"
          : "text-gray-400 dark:text-gray-400"
      } ${className}`}
      value={value ?? defaultValue}
      onChange={handleChange}
    >
      <option
        value=""
        disabled
        className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
      >
        {placeholder}
      </option>

      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
        >
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default Select;
