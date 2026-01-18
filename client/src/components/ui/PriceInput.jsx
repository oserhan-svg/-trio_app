import React, { useState, useEffect } from 'react';

const PriceInput = ({ value, onChange, placeholder, className = "", id }) => {
    const [displayValue, setDisplayValue] = useState("");

    // Update display value when the external value changes
    useEffect(() => {
        if (value === "" || value === null || value === undefined) {
            setDisplayValue("");
        } else {
            const formatted = formatNumber(value.toString());
            // Only update if it's different to avoid cursor jumps
            if (formatted !== displayValue) {
                setDisplayValue(formatted);
            }
        }
    }, [value]);

    const formatNumber = (val) => {
        if (!val) return "";
        // Remove all non-digits
        const nums = val.replace(/\D/g, "");
        // Format with dots
        return nums.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const handleChange = (e) => {
        const inputVal = e.target.value;
        const numericVal = inputVal.replace(/\D/g, "");

        // Update local display immediately for smoothness
        const formatted = formatNumber(numericVal);
        setDisplayValue(formatted);

        // Notify parent with the numeric version
        if (onChange) {
            onChange(numericVal === "" ? "" : parseInt(numericVal, 10));
        }
    };

    return (
        <input
            id={id}
            type="text"
            inputMode="numeric"
            className={className}
            placeholder={placeholder}
            value={displayValue}
            onChange={handleChange}
        />
    );
};

export default PriceInput;
