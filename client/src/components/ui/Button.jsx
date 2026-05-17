import React from 'react';

const Button = ({ children, variant = 'primary', className = '', isLoading = false, ...props }) => {
    const baseStyles = 'px-4 py-2 rounded-xl transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center gap-2';

    const variants = {
        primary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 focus:ring-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed',
        secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm focus:ring-gray-200 disabled:opacity-70 disabled:cursor-not-allowed',
        outline: 'bg-transparent border border-emerald-600 text-emerald-600 hover:bg-emerald-50 disabled:opacity-70 disabled:cursor-not-allowed',
        ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-70 disabled:cursor-not-allowed',
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className}`}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {children}
        </button>
    );
};

export default Button;
