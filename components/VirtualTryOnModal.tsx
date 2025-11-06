import React, { useState, useRef } from 'react';
import { editImageWithGemini } from '../services/geminiService';
import { SendIcon, playSound, clickSound, cameraShutterSound, swooshSound, successSound, errorSound } from '../constants';

interface VirtualTryOnModalProps {
    onClose: () => void;
}

const VirtualTryOnModal: React.FC<VirtualTryOnModalProps> = ({ onClose }) => {
    const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<{ data: string; mime: string; url: string } | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const hasStartedCamera = useRef(false);

    const startCamera = async () => {
         if (!navigator.mediaDevices?.getUserMedia) {
            setError("Camera access is not supported by your browser.");
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setVideoStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            let message = "Could not access the camera. Please check your connection and try again.";
            if (err instanceof Error) {
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    message = "Camera access was denied. To use this feature, please enable camera permissions for this site in your browser settings and refresh the page.";
                } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                    message = "No camera was found on your device. Please connect a camera and try again.";
                }
            }
            setError(message);
        }
    };
    
    // WORKAROUND: Imperatively start camera on first render to avoid useEffect.
    if (!hasStartedCamera.current) {
        if (!capturedImage) {
            startCamera();
        }
        hasStartedCamera.current = true;
    }

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            playSound(cameraShutterSound, 0.4);
            const video = videoRef.current;
            const canvas = canvasRef.current;
            
            const MAX_WIDTH = 1024;
            const MAX_HEIGHT = 1024;
            let width = video.videoWidth;
            let height = video.videoHeight;
    
            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d')?.drawImage(video, 0, 0, width, height);
            
            const mime = 'image/jpeg';
            const quality = 0.9;
            const url = canvas.toDataURL(mime, quality);
            const base64Data = url.split(',')[1];
            setCapturedImage({ data: base64Data, mime, url });
            videoStream?.getTracks().forEach(track => track.stop());
            setVideoStream(null);
        }
    };

    const handleRetake = () => {
        playSound(clickSound);
        setCapturedImage(null);
        setGeneratedImage(null);
        setError(null);
        setPrompt('');
        startCamera(); // Restart camera
    };

    const handleGenerate = async () => {
        if (!capturedImage || !prompt.trim()) return;
        playSound(swooshSound);
        setIsLoading(true);
        setGeneratedImage(null);
        setError(null);
        try {
            const result = await editImageWithGemini(capturedImage.data, capturedImage.mime, prompt);
            setGeneratedImage(`data:image/jpeg;base64,${result}`);
            playSound(successSound);
        } catch (err) {
            playSound(errorSound);
            setError(err instanceof Error ? err.message : "Failed to generate image.");
        } finally {
            setIsLoading(false);
        }
    };

    // WORKAROUND: Explicitly handle cleanup on close since useEffect is unavailable.
    const handleClose = () => {
        playSound(clickSound);
        videoStream?.getTracks().forEach(track => track.stop());
        onClose();
    };
    
    const renderContent = () => {
        if (error) {
            return <div className="text-center p-8"><p className="text-red-400">{error}</p></div>;
        }

        if (capturedImage) {
            return (
                <div className="p-4 flex flex-col items-center gap-4">
                    <div className="relative w-full max-w-md aspect-auto rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600">
                         {generatedImage ? <img src={generatedImage} alt="Generated result" className="w-full h-full object-contain" /> : <img src={capturedImage.url} alt="Captured" className="w-full h-full object-contain" />}
                         {isLoading && (
                            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400"></div>
                                <p className="text-white mt-4">Generating your view...</p>
                            </div>
                         )}
                    </div>

                    <div className="w-full max-w-md flex items-center gap-2">
                        <input
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., add a blue t-shirt"
                            className="flex-grow bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full py-2 px-4 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            disabled={isLoading}
                        />
                        <button onClick={handleGenerate} disabled={isLoading || !prompt.trim()} className="bg-teal-500 hover:bg-teal-600 text-white rounded-full p-2.5 transition-colors disabled:bg-gray-600">
                           <SendIcon />
                        </button>
                    </div>
                     <button onClick={handleRetake} className="text-sm text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white mt-2">Retake Photo</button>
                </div>
            );
        }

        return (
            <div className="p-4 flex flex-col items-center gap-4">
                 <video ref={videoRef} autoPlay playsInline muted className="w-full max-w-md rounded-lg border-2 border-gray-300 dark:border-gray-600"></video>
                 <button onClick={handleCapture} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full transition-colors">Capture Photo</button>
            </div>
        )
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 flex flex-col">
                <header className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-bold text-black dark:text-white">Virtual Try-On</h2>
                    <button onClick={handleClose} className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white text-2xl leading-none">&times;</button>
                </header>
                <div className="flex-1">
                    {renderContent()}
                </div>
                 <canvas ref={canvasRef} className="hidden"></canvas>
            </div>
        </div>
    );
};

export default VirtualTryOnModal;