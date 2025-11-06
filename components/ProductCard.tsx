import * as React from 'react';
import { Product } from '../types';

interface ProductCardProps {
    product: Product;
}

const TicketIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
);

const ProductIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
);

const LinkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
);

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    const [imageError, setImageError] = React.useState(false);
    const buttonText = product.type === 'ticket' ? 'Book Now' : 'Buy Now';

    const formattedPrice = product.price
        ? product.price.trim().startsWith('₹')
            ? product.price.trim()
            : `₹${product.price.replace('$', '').trim()}`
        : null;

    const showImage = product.imageUrl && !imageError;

    let sourceHostname = '';
    if (product.sourceUrl) {
        try {
            sourceHostname = new URL(product.sourceUrl).hostname.replace(/^www\./, '');
        } catch (e) {
            // invalid URL
        }
    }

    return (
        <div
            className="flex items-center gap-4 p-3 bg-gray-200/50 hover:bg-gray-200 dark:bg-gray-600/50 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200"
        >
            <div className="w-14 h-14 rounded-md bg-gray-300 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center overflow-hidden">
                {showImage ? (
                    <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    product.type === 'ticket' ? <TicketIcon /> : <ProductIcon />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-gray-800 dark:text-gray-200 font-medium truncate text-sm" title={product.name}>
                    {product.name}
                </p>
                {product.price && (
                    <p className="text-teal-600 dark:text-teal-400 text-xs font-semibold mt-1">
                        {formattedPrice}
                    </p>
                )}
                {sourceHostname && (
                    <a href={product.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 mt-1.5 group">
                        <LinkIcon />
                        <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:underline truncate" title={product.sourceUrl}>
                            {sourceHostname}
                        </span>
                    </a>
                )}
            </div>
            <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-full transition-colors duration-200 whitespace-nowrap text-xs flex-shrink-0"
            >
                {buttonText}
            </a>
        </div>
    );
};

export default ProductCard;