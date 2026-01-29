import React, { useState, useEffect, useRef } from 'react';
import PropertyCard from './PropertyCard'; // Assuming standard card component

/**
 * A high-performance list that only renders items near the viewport
 */
const VirtualizedPropertyList = ({ listings, itemsPerBatch = 20 }) => {
    const [renderCount, setRenderCount] = useState(itemsPerBatch);
    const observerTarget = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && renderCount < listings.length) {
                    setRenderCount(prev => Math.min(prev + itemsPerBatch, listings.length));
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [renderCount, listings.length]);

    // Reset render count if listings filter changes drastically
    useEffect(() => {
        setRenderCount(itemsPerBatch);
    }, [listings.length]);

    const visibleListings = listings.slice(0, renderCount);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleListings.map(property => (
                    <PropertyCard key={property.id} property={property} />
                ))}
            </div>

            {/* sentinel for infinte scroll */}
            {renderCount < listings.length && (
                <div
                    ref={observerTarget}
                    className="h-24 flex items-center justify-center text-gray-400 text-sm italic"
                >
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent mr-2"></div>
                    Daha fazla ilan yükleniyor ({renderCount} / {listings.length})
                </div>
            )}
        </div>
    );
};

export default VirtualizedPropertyList;
