import React from 'react';
import OpportunityCarousel from './OpportunityCarousel';
import PriceDistributionChart from './PriceDistributionChart';
import NeighborhoodChart from './NeighborhoodChart';
import RentalRateWidget from './dashboard/RentalRateWidget';

const DashboardStatsHeader = ({ properties, stats }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 relative z-50">
            {/* 1. Rental Rate Widget */}
            <div className="h-44">
                <RentalRateWidget />
            </div>

            {/* 2. Opportunity Carousel (Compact Mode) */}
            <div className="h-44">
                <OpportunityCarousel compact={true} />
            </div>

            {/* 3. Price Distribution Chart */}
            <div className="h-44">
                <PriceDistributionChart data={properties} />
            </div>

            {/* 4. Neighborhood Chart */}
            <div className="h-44">
                <NeighborhoodChart stats={stats} />
            </div>
        </div>
    );
};

export default DashboardStatsHeader;
