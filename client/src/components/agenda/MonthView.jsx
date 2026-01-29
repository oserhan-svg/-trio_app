import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, User } from 'lucide-react';

const MonthView = ({ items, currentDate, onDateChange, onItemClick, onSlotClick }) => {
    // Helper to get days in month
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday

        // Adjust for Monday start (Turkey standard)
        // 0 (Sun) -> 6, 1 (Mon) -> 0
        const firstDayAdjusted = firstDay === 0 ? 6 : firstDay - 1;

        const res = [];
        // Empty slots
        for (let i = 0; i < firstDayAdjusted; i++) {
            res.push(null);
        }
        // Days
        for (let i = 1; i <= days; i++) {
            res.push(new Date(year, month, i));
        }
        return res;
    };

    // Memoize days calculation
    const days = React.useMemo(() => getDaysInMonth(currentDate), [currentDate]);

    // Create a map for $O(1)$ lookup of items by date
    const itemsByDate = React.useMemo(() => {
        const map = {};
        items.forEach(item => {
            const date = new Date(item.start_at);
            const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            if (!map[key]) map[key] = [];
            map[key].push(item);
        });
        return map;
    }, [items]);

    const getItemsForDate = (date) => {
        if (!date) return [];
        const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        return itemsByDate[key] || [];
    };

    const monthName = currentDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    const today = new Date();

    const isToday = (date) => {
        return date && date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    };

    const handlePrevMonth = () => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() - 1);
        onDateChange(newDate);
    };

    const handleNextMonth = () => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + 1);
        onDateChange(newDate);
    };

    const handleToday = () => {
        onDateChange(new Date());
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300">
            {/* Calendar Header */}
            <div className="p-4 flex items-center justify-between border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-lg font-bold text-gray-800 capitalize flex items-center gap-2">
                    <span className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 text-blue-600">
                        {currentDate.toLocaleDateString('tr-TR', { month: 'short' }).toUpperCase()}
                    </span>
                    {monthName}
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleToday}
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Bugün
                    </button>
                    <div className="flex bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
                        <button onClick={handlePrevMonth} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-600">
                            <ChevronLeft size={20} />
                        </button>
                        <div className="w-px bg-gray-200 mx-1"></div>
                        <button onClick={handleNextMonth} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-600">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
                {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(d => (
                    <div key={d} className="py-2.5 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                        {d}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 auto-rows-fr bg-gray-200 gap-px border-b border-gray-200">
                {days.map((date, idx) => {
                    const dayItems = getItemsForDate(date);
                    const isCurrentDay = date && isToday(date);

                    return (
                        <div
                            key={idx}
                            onClick={() => date && onSlotClick(date)}
                            className={`min-h-[140px] bg-white p-2 transition-colors relative group
                                ${!date ? 'bg-gray-50/50 cursor-default' : 'hover:bg-blue-50/30 cursor-pointer'}
                                ${isCurrentDay ? 'bg-blue-50/20' : ''}
                            `}
                        >
                            {date && (
                                <>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold transition-all
                                            ${isCurrentDay
                                                ? 'bg-blue-600 text-white shadow-md shadow-blue-200 scale-110'
                                                : 'text-gray-700 bg-gray-100'}
                                        `}>
                                            {date.getDate()}
                                        </span>
                                        {/* Add button visible on hover */}
                                        <button className="opacity-0 group-hover:opacity-100 text-blue-400 hover:text-blue-600 transition-opacity p-0.5" title="Hızlı Ekle">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="space-y-1 overflow-hidden">
                                        {dayItems.slice(0, 4).map(item => (
                                            <div
                                                key={item.id}
                                                onClick={(e) => { e.stopPropagation(); onItemClick(item); }}
                                                className={`text-[10px] p-1.5 rounded-md border truncate cursor-pointer transition-all hover:scale-[1.02] shadow-sm select-none
                                                    ${item.type === 'meeting' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                        item.type === 'google_event' ? 'bg-white text-gray-600 border-gray-200 pl-1' :
                                                            item.type === 'showing' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                                                'bg-blue-50 text-blue-700 border-blue-100'}
                                                    ${item.status === 'completed' ? 'opacity-50 line-through grayscale' : ''}
                                                `}
                                                title={item.title}
                                            >
                                                <div className="flex items-center gap-1">
                                                    {/* Dot indicator */}
                                                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.type === 'meeting' ? 'bg-purple-500' :
                                                        item.type === 'showing' ? 'bg-orange-500' :
                                                            item.type === 'google_event' ? 'bg-blue-500' :
                                                                'bg-blue-500'
                                                        }`} />

                                                    <span className="font-bold shrink-0">
                                                        {(() => {
                                                            const d = new Date(item.start_at);
                                                            return isNaN(d.getTime()) ? '--:--' : d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                                                        })()}
                                                    </span>
                                                    <span className="truncate">{item.title}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {dayItems.length > 4 && (
                                            <div className="text-[10px] text-gray-400 font-bold text-center hover:text-blue-600 py-1 bg-gray-50/50 rounded mt-1">
                                                +{dayItems.length - 4} daha
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="p-3 bg-gray-50 text-xs text-gray-500 font-medium flex gap-4">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500"></span>Toplantı</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500"></span>Sunum</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Genel</div>
            </div>
        </div>
    );
};

const PlusIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

export default MonthView;
