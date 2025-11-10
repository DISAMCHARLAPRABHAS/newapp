import React, { useState } from 'react';
import { Product } from '../types';

interface ProductCardProps {
    product: Product;
}

// Icons (unchanged)
const TicketIcon: React.FC<{ className?: string }> = ({ className = "h-6 w-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`${className} text-gray-500 dark:text-gray-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
);

const ProductIcon: React.FC<{ className?: string }> = ({ className = "h-6 w-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`${className} text-gray-500 dark:text-gray-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
);

const LinkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
);

const StarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    const [imageError, setImageError] = useState(false);
    const buttonText = product.type === 'ticket' ? 'Book Now' : 'Buy Now';

    const formattedPrice = product.price
        ? product.price.trim().startsWith('₹')
            ? product.price.trim()
            : `₹${product.price.replace('$', '').trim()}`
        : null;

    // This check is now only used for the image tag itself
    const showImage = product.imageUrl && !imageError && product.type === 'product';

    let sourceHostname = '';
    if (product.sourceUrl) {
        try {
            sourceHostname = new URL(product.sourceUrl).hostname.replace(/^www\./, '');
        } catch (e) {
            // invalid URL
        }
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl transition-shadow duration-200 shadow-sm hover:shadow-md overflow-hidden flex flex-col">
            
            {/* --- THIS IS THE FIX --- */}
            {/* This entire block is now conditional. It only renders if the type is 'product'. */}
            {product.type === 'product' && (
                <div className="relative w-full aspect-video bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    {showImage ? (
                        <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <ProductIcon className="h-10 w-10" />
                    )}
                </div>
            )}
            {/* End of the conditional block */}

            <div className="p-4 flex flex-col flex-1">
                <div className="flex-1 space-y-2">
                    <p className="text-gray-800 dark:text-gray-200 font-semibold" title={product.name}>
                        {product.name}
                    </p>

                    {product.price && (
                        <p className="text-teal-600 dark:text-teal-400 text-sm font-bold">
                            {formattedPrice}
                        </p>
                    )}

                    {product.reviewSummary && (
                         <div className="flex items-start gap-1.5">
                            <div className="flex-shrink-0 pt-0.5">
                                <StarIcon />
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs" title={product.reviewSummary}>
                                {product.reviewSummary}
                            </p>
                        </div>
                    )}

                    {sourceHostname && (
                        <a href={product.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 group pt-1">
                            <LinkIcon />
                            <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:underline truncate" title={product.sourceUrl}>
                                {sourceHostname}
                            </span>
                        </a>
                    )}
                </div>

                <div className="mt-4">
                    <a
                        href={product.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full text-center bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2.5 px-4 rounded-full transition-colors duration-200 whitespace-nowrap text-sm"
                    >
                        {buttonText}
                    </a>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;