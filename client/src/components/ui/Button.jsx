import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
    children,
    variant = 'primary',
    className = '',
    isLoading = false,
    loadingText,
    disabled,
    ...props
}) => {
    const baseStyles = 'px-4 py-2 rounded-xl transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center gap-2';

    const variants = {
        primary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 focus:ring-emerald-500',
        secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm focus:ring-gray-200',
        outline: 'bg-transparent border border-emerald-600 text-emerald-600 hover:bg-emerald-50',
        ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900',
    };

    const isDisabled = disabled || isLoading;

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className} ${isDisabled ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={isDisabled}
            aria-busy={isLoading}
            {...props}
        >
            {isLoading ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {loadingText || children}
                </>
            ) : (
                children
            )}
        </button>
    );
};

export default Button;
