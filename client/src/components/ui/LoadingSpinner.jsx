import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ fullScreen = true }) => {
    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-white bg-opacity-80 z-50 flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
    );
};

export default LoadingSpinner;
