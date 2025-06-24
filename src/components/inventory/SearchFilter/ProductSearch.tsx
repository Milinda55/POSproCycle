
import React, { useState } from 'react';
import { CATEGORIES } from '../../../utils/constants';

interface ProductSearchProps {
    onSearch: (query: string, category?: string) => void;
}

export const ProductSearch: React.FC<ProductSearchProps> = ({ onSearch }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    const handleSearch = () => {
        onSearch(searchQuery, selectedCategory || undefined);
    };

    const handleReset = () => {
        setSearchQuery('');
        setSelectedCategory('');
        onSearch(''); // Reset to show all products
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="product-search">
            <div className="search-controls">
                <div className="search-input-group">
                    <input
                        type="text"
                        placeholder="Search by name or barcode..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="search-input"
                    />

                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="category-filter"
                    >
                        <option value="">All Categories</option>
                        {CATEGORIES.map(category => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="search-buttons">
                    <button onClick={handleSearch} className="btn-search">
                        Search
                    </button>
                    <button onClick={handleReset} className="btn-reset">
                        Reset
                    </button>
                </div>
            </div>
        </div>
    );
};