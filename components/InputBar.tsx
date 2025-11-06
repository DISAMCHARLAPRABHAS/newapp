import React, { useState, useRef } from 'react';
import { SendIcon, MicrophoneIcon, PaperclipIcon, CameraIcon, DeleteIcon, PlusIcon, playSound, clickSound, micOnSound, micOffSound, deleteSound } from '../constants';

// For browser compatibility
// Fix: Cast window to 'any' to access non-standard SpeechRecognition APIs.
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

interface InputBarProps {
    onSearch: (prompt: string, file?: { data: string; mimeType: string }) => void;
    isLoading: boolean;
    onMakeViewClick: () => void;
}

const InputBar: React.FC<InputBarProps> = ({ onSearch, isLoading, onMakeViewClick }) => {
    const [prompt, setPrompt] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [attachedFile, setAttachedFile] = useState<{ name: string; data: string; mimeType: string; preview: string } | null>(null);
    const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);

    const recognitionRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const speechBaseTextRef = useRef<string>('');
    
    // WORKAROUND: Use useState initializer for one-time setup to avoid useEffect.
    useState(() => {
        if (!SpeechRecognition) {
            console.warn("SpeechRecognition API not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results)
                .map((result: any) => result[0])
                .map((result: any) => result.transcript)
                .join('');
            
            const baseText = speechBaseTextRef.current;
            // Use function form of setState to get the latest baseText from the ref.
            setPrompt(baseText ? `${baseText} ${transcript}` : transcript);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
    });

    const handleListen = () => {
        if (isListening) {
            playSound(micOffSound);
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            playSound(micOnSound);
            speechBaseTextRef.current = prompt.trim();
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64Data = (e.target?.result as string).split(',')[1];
                setAttachedFile({
                    name: file.name,
                    data: base64Data,
                    mimeType: file.type,
                    preview: URL.createObjectURL(file),
                });
            };
            reader.readAsDataURL(file);
        }
         // Reset file input value to allow re-uploading the same file
        event.target.value = '';
    };
    
    const handleVirtualTryOnClick = () => {
        playSound(clickSound);
        onMakeViewClick();
        setIsAttachmentMenuOpen(false);
    }
    
    const handleUploadClick = () => {
        playSound(clickSound);
        fileInputRef.current?.click();
        setIsAttachmentMenuOpen(false);
    }
    
    const handleRemoveAttachment = () => {
        playSound(deleteSound);
        setAttachedFile(null);
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if ((prompt.trim() || attachedFile) && !isLoading) {
            onSearch(prompt.trim(), attachedFile ? { data: attachedFile.data, mimeType: attachedFile.mimeType } : undefined);
            setPrompt('');
            setAttachedFile(null);
        }
    };

    return (
        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-4 border-t border-gray-200 dark:border-gray-700">
            {attachedFile && (
                <div className="max-w-4xl mx-auto mb-2 p-2 bg-gray-200/50 dark:bg-gray-700/50 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src={attachedFile.preview} alt="preview" className="w-12 h-12 rounded-md object-cover" />
                        <span className="text-sm text-gray-600 dark:text-gray-300 truncate">{attachedFile.name}</span>
                    </div>
                    <button onClick={handleRemoveAttachment} className="p-1.5 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600">
                        <DeleteIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>
            )}
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex items-center gap-3 relative">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                />
                 <div className="relative">
                    {isAttachmentMenuOpen && (
                        <div className="absolute bottom-14 left-0 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
                           <button type="button" onClick={handleUploadClick} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                                <PaperclipIcon className="w-5 h-5" />
                                <span>Upload Image</span>
                           </button>
                            <button type="button" onClick={handleVirtualTryOnClick} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                                <CameraIcon className="w-5 h-5" />
                                <span>Virtual Try-On</span>
                            </button>
                        </div>
                    )}
                    <button type="button" onClick={() => { playSound(clickSound); setIsAttachmentMenuOpen(prev => !prev); }} className={`text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 ${isAttachmentMenuOpen ? 'rotate-45 bg-gray-200 dark:bg-gray-700' : ''}`} aria-label="Attach file">
                        <PlusIcon />
                    </button>
                 </div>

                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ask Synapse, or describe the attached image..."
                    className="flex-grow bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full py-3 px-5 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-300"
                    disabled={isLoading}
                />
                
                {SpeechRecognition && (
                    <button type="button" onClick={handleListen} disabled={isLoading} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:text-gray-400 dark:disabled:text-gray-600" aria-label={isListening ? 'Stop listening' : 'Start listening'}>
                        <MicrophoneIcon isListening={isListening} />
                    </button>
                )}
                
                <button
                    type="submit"
                    className="bg-teal-500 hover:bg-teal-600 text-white rounded-full p-3 transition-colors duration-200 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex-shrink-0"
                    disabled={isLoading || (!prompt.trim() && !attachedFile)}
                >
                    <SendIcon />
                </button>
            </form>
        </div>
    );
};

export default InputBar;