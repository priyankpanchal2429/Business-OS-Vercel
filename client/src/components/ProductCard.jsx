import React, { useState } from 'react';
import { Package, MoreVertical, Edit2, Trash2 } from 'lucide-react';

const ProductCard = ({ item, onEdit, onDelete, viewMode = 'grid' }) => {
    const [showActions, setShowActions] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);

    // List View Layout (Preserved with inline styles for backward compatibility, slightly cleaned up)
    if (viewMode === 'list') {
        return (
            <div
                className="group bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-5 transition-all hover:shadow-lg hover:border-blue-500 cursor-pointer relative min-h-[120px]"
                onMouseLeave={() => setShowActions(false)}
            >
                {/* Image */}
                <div className="w-[90px] h-[90px] bg-white rounded-xl border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                    {item.imageUrl ? (
                        <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-contain p-2"
                        />
                    ) : (
                        <Package size={36} className="text-gray-300" strokeWidth={1.5} />
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="m-0 text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {item.name}
                        </h3>
                        {item.category && (
                            <span className="bg-gray-100 px-2.5 py-1 rounded-md text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                {item.category}
                            </span>
                        )}
                    </div>

                    {item.description && (
                        <p className="m-0 mb-3 text-sm text-gray-500 truncate">
                            {item.description}
                        </p>
                    )}

                    <div className="flex gap-5 text-sm">
                        {item.hsnCode && (
                            <div>
                                <span className="text-gray-400 mr-1">HSN:</span>
                                <span className="font-semibold text-gray-700">{item.hsnCode}</span>
                            </div>
                        )}
                        {item.type && (
                            <div>
                                <span className="text-gray-400 mr-1">Type:</span>
                                <span className="font-semibold text-gray-700">{item.type}</span>
                            </div>
                        )}
                        {item.vendorName && (
                            <div>
                                <span className="text-gray-400 mr-1">Vendor:</span>
                                <span className="font-semibold text-gray-700">{item.vendorName}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions Menu */}
                <div className="relative">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowActions(!showActions);
                        }}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <MoreVertical size={20} />
                    </button>

                    {showActions && (
                        <div className="absolute right-0 top-[110%] bg-white border border-gray-100 rounded-xl shadow-xl z-20 min-w-[140px] overflow-hidden">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(item);
                                    setShowActions(false);
                                }}
                                className="w-full text-left px-4 py-3 bg-transparent border-0 border-b border-gray-100 cursor-pointer flex items-center gap-2 text-sm text-gray-700 font-medium hover:bg-gray-50"
                            >
                                <Edit2 size={16} /> Edit
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(item);
                                    setShowActions(false);
                                }}
                                className="w-full text-left px-4 py-3 bg-transparent border-0 cursor-pointer flex items-center gap-2 text-sm text-red-600 font-medium hover:bg-red-50"
                            >
                                <Trash2 size={16} /> Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Grid View Layout (Standard Card with Image Top)
    return (
        <>
            {/* Image Zoom Modal */}
            {showImageModal && item.imageUrl && (
                <div
                    onClick={() => setShowImageModal(false)}
                    className="fixed inset-0 bg-black/85 z-[9999] flex items-center justify-center p-10 cursor-zoom-out backdrop-blur-sm"
                >
                    <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="max-w-[90%] max-h-[90%] object-contain rounded-xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            {/* Main Card */}
            <div
                className="group w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-500 hover:shadow-xl hover:border-blue-500 hover:-translate-y-1 relative flex flex-col h-full"
                onMouseLeave={() => setShowActions(false)}
            >
                {/* Image Container - Adjusted height for 6-up grid */}
                <div
                    className="relative w-full h-40 overflow-hidden cursor-zoom-in bg-gray-50 border-b border-gray-50"
                    onClick={() => item.imageUrl && setShowImageModal(true)}
                >
                    {/* Category Badge - Top Left Floating */}
                    {item.category && (
                        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-blue-600 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm z-10 border border-blue-50">
                            {item.category}
                        </div>
                    )}

                    {/* Image Scale Effect */}
                    <div className="w-full h-full transition-transform duration-700 ease-out group-hover:scale-[1.06]">
                        {item.imageUrl ? (
                            <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-contain p-2"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <Package size={40} strokeWidth={1} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Section */}
                <div className="px-4 pb-4 pt-2 flex flex-col flex-1">
                    {/* Header & Description Grouped Tightly */}
                    <div className="flex flex-col gap-0.5 mb-1">
                        <h2 className="text-base font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
                            {item.name}
                        </h2>
                        {item.description && (
                            <p className="text-gray-500 text-sm leading-tight line-clamp-2">
                                {item.description}
                            </p>
                        )}
                    </div>

                    {/* Spacer to push footer to bottom */}
                    <div className="mt-1 pt-2 border-t border-gray-100 flex items-end justify-between">
                        {/* Vendor Info - At Bottom */}
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">
                                Vendor
                            </span>
                            <span className="text-sm font-semibold text-gray-700 truncate max-w-[120px]" title={item.vendorName}>
                                {item.vendorName || 'In House'}
                            </span>
                        </div>

                        {/* Three-Dot Menu Action */}
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowActions(!showActions);
                                }}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400
                                        transition-all duration-200 hover:bg-gray-100 hover:text-gray-900"
                            >
                                <MoreVertical size={18} />
                            </button>

                            {/* Dropdown Menu */}
                            {showActions && (
                                <div className="absolute right-0 bottom-full mb-2 bg-white border border-gray-100 rounded-xl shadow-xl z-20 min-w-[140px] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    <div className="p-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit(item);
                                                setShowActions(false);
                                            }}
                                            className="w-full text-left px-3 py-2 rounded-lg bg-transparent border-0 cursor-pointer flex items-center gap-2 text-xs text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                        >
                                            <Edit2 size={14} className="text-blue-500" /> Edit
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(item);
                                                setShowActions(false);
                                            }}
                                            className="w-full text-left px-3 py-2 rounded-lg bg-transparent border-0 cursor-pointer flex items-center gap-2 text-xs text-red-600 font-medium hover:bg-red-50 transition-colors mt-0.5"
                                        >
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ProductCard;
