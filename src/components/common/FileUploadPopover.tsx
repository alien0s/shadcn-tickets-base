import React, { useState, useRef } from "react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { X, Upload, File as FileIcon, Image as ImageIcon, Paperclip } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FileUploadPopoverProps {
    onFilesChange?: (files: File[]) => void;
}

export function FileUploadPopover({ onFilesChange }: FileUploadPopoverProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            const updatedFiles = [...files, ...newFiles];
            setFiles(updatedFiles);
            onFilesChange?.(updatedFiles);
        }
    };

    const removeFile = (index: number) => {
        const updatedFiles = files.filter((_, i) => i !== index);
        setFiles(updatedFiles);
        onFilesChange?.(updatedFiles);
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                    <Paperclip className="h-5 w-5" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
                <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium leading-none">Arquivos ({files.length})</h4>
                        <Button variant="outline" size="sm" onClick={triggerFileInput} className="h-8 gap-2">
                            <Upload className="h-3.5 w-3.5" />
                            Adicionar
                        </Button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            multiple
                            onChange={handleFileSelect}
                        />
                    </div>

                    {files.length > 0 ? (
                        <ScrollArea className="h-[200px] w-full pr-4">
                            <div className="grid grid-cols-2 gap-2">
                                {files.map((file, index) => (
                                    <div key={index} className="relative group rounded-md border bg-muted/50 overflow-hidden aspect-square flex flex-col items-center justify-center p-2 text-center">
                                        <button
                                            onClick={() => removeFile(index)}
                                            className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/80 hover:bg-background flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>

                                        {file.type.startsWith("image/") ? (
                                            <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                                        ) : (
                                            <FileIcon className="h-8 w-8 text-muted-foreground mb-2" />
                                        )}

                                        <span className="text-xs text-muted-foreground w-full truncate px-1">
                                            {file.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    ) : (
                        <div
                            className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={triggerFileInput}
                        >
                            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                                Clique para fazer upload
                            </p>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
