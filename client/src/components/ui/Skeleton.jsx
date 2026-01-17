import React from 'react';

const Skeleton = ({ className, ...props }) => {
    return (
        <div
            className={`animate-pulse rounded bg-gray-200 ${className}`}
            {...props}
        />
    );
};

export { Skeleton };
