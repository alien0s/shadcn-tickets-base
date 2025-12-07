import React, { useRef, useState } from "react";
import { Upload, X, File as FileIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropZoneProps {
    files: File[];
    onFilesChange: (files: File[]) => void;
    className?: string;
    dropZoneClassName?: string;
    maxFiles?: number;
}

export function FileDropZone({ files, onFilesChange, className, dropZoneClassName, maxFiles = 4 }: FileDropZoneProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            const availableSlots = maxFiles - files.length;
            const filesToAdd = newFiles.slice(0, availableSlots);

            if (filesToAdd.length > 0) {
                onFilesChange([...files, ...filesToAdd]);
            }
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) {
            const newFiles = Array.from(e.dataTransfer.files);
            const availableSlots = maxFiles - files.length;
            const filesToAdd = newFiles.slice(0, availableSlots);

            if (filesToAdd.length > 0) {
                onFilesChange([...files, ...filesToAdd]);
            }
        }
    };

    const removeFile = (index: number) => {
        const updatedFiles = files.filter((_, i) => i !== index);
        onFilesChange(updatedFiles);
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className={cn("space-y-4", className)}>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                onChange={handleFileSelect}
            />

            {files.length === 0 ? (
                /* Dropzone Area */
                <div
                    onClick={triggerFileInput}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                        "border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors",
                        isDragging
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/50",
                        dropZoneClassName
                    )}
                >
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">
                        Drop your image here or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Max size: 5MB</p>
                </div>
            ) : (
                /* File List + Add Button */
                <div className="grid grid-cols-4 gap-2">
                    {files.map((file, index) => (
                        <div
                            key={index}
                            className="relative group rounded-md border bg-muted/50 overflow-hidden aspect-square flex flex-col items-center justify-center p-2 text-center"
                        >
                            <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/80 hover:bg-background flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>

                            {file.type.startsWith("image/") ? (
                                <div className="relative w-full h-full flex items-center justify-center">
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt={file.name}
                                        className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity"
                                        onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
                                    />
                                </div>
                            ) : (
                                <FileIcon className="h-8 w-8 text-muted-foreground mb-2" />
                            )}

                            <span className="text-[10px] text-muted-foreground w-full truncate px-1 absolute bottom-1 bg-background/50 backdrop-blur-sm">
                                {file.name}
                            </span>
                        </div>
                    ))}

                    {/* Add Button */}
                    {files.length < maxFiles && (
                        <div
                            onClick={triggerFileInput}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={cn(
                                "border-2 border-dashed rounded-md bg-muted/30 hover:bg-muted/50 cursor-pointer flex flex-col items-center justify-center aspect-square transition-colors",
                                isDragging ? "border-primary bg-primary/5" : "border-border"
                            )}
                        >
                            <Plus className="h-6 w-6 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground mt-1">Adicionar</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
