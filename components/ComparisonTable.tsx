import React from 'react';
import { ComparisonItem } from '../types';

interface ComparisonTableProps {
    tableData: ComparisonItem[];
}

const ComparisonTable: React.FC<ComparisonTableProps> = ({ tableData }) => {
    // Define the headers based on the data we requested
    const headers = [
        "Product",
        "Original Price",
        "Discount Price",
        "Offers",
        "Rating",
        "Review Summary",
        "Link"
    ];

    return (
        <div className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-bold p-3 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
                Comparison Table
            </h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            {headers.map(header => (
                                <th key={header} className="px-3 py-2 font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {tableData.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-3 py-3 text-gray-800 dark:text-gray-200 font-medium whitespace-nowrap">
                                    {item.name || '-'}
                                </td>
                                <td className="px-3 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                    {item.original_price || '-'}
                                </td>
                                <td className="px-3 py-3 text-teal-600 dark:text-teal-400 font-bold whitespace-nowrap">
                                    {item.discounted_price || '-'}
                                </td>
                                <td className="px-3 py-3 text-gray-600 dark:text-gray-400 min-w-[150px]">
                                    {item.offers || '-'}
                                </td>
                                <td className="px-3 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                    {item.rating_out_of_5 || '-'}
                                </td>
                                <td className="px-3 py-3 text-gray-600 dark:text-gray-400 min-w-[200px]">
                                    {item.review_summary || '-'}
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap">
                                    <a 
                                        href={item.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-cyan-500 hover:text-cyan-600 hover:underline font-medium"
                                    >
                                        View
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ComparisonTable;