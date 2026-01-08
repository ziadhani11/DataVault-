import { useState, useRef } from 'react';
import { Upload, Loader2, FileSpreadsheet, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFileUpload, type UploadedFile, type ParsedData } from '@/hooks/useFileUpload';

interface FileUploadZoneProps {
  onFileUploaded?: (file: UploadedFile, data: ParsedData) => void;
}

export function FileUploadZone({ onFileUploaded }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploading, parsedData, uploadFile } = useFileUpload();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const validFile = files.find(f => 
      f.name.endsWith('.xlsx') || f.name.endsWith('.xls') || f.name.endsWith('.csv')
    );
    
    if (validFile) {
      setSelectedFile(validFile);
      const result = await uploadFile(validFile);
      if (result && parsedData && onFileUploaded) {
        onFileUploaded(result, parsedData);
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const result = await uploadFile(file);
      if (result && parsedData && onFileUploaded) {
        onFileUploaded(result, parsedData);
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const clearSelection = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      className={`glass rounded-2xl p-8 border-2 border-dashed transition-all duration-300 ${
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div className="text-center">
        {uploading ? (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-1">
                Uploading & Parsing...
              </h3>
              <p className="text-muted-foreground">{selectedFile?.name}</p>
            </div>
          </div>
        ) : selectedFile && parsedData ? (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
              <FileSpreadsheet className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-1">
                File Uploaded!
              </h3>
              <p className="text-muted-foreground mb-2">{selectedFile.name}</p>
              <p className="text-sm text-primary">
                {parsedData.headers.length} columns • {parsedData.rows.length} rows
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={clearSelection}>
              <X className="h-4 w-4 mr-2" />
              Upload Another
            </Button>
          </div>
        ) : (
          <>
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 shadow-glow animate-float">
              <Upload className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Upload your Excel files
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Drag and drop your .xlsx, .xls, or .csv files here, or click to browse
            </p>
            <Button variant="hero" size="lg" onClick={handleClick}>
              Select Files
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
