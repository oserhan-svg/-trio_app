import React from 'react';

const Input = ({ label, id, error, className = '', ...props }) => {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && (
                <label htmlFor={id} className="text-sm font-medium text-gray-700">
                    {label}
                </label>
            )}
            <input
                id={id}
                className={`
          px-3 py-2 rounded-xl border border-gray-300 bg-white text-gray-900 
          focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
          placeholder:text-gray-400
          disabled:bg-gray-50 disabled:text-gray-500
          transition-all duration-200
          ${error ? 'border-red-500 focus:ring-red-200' : ''}
        `}
                {...props}
            />
            {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
    );
};

export default Input;
