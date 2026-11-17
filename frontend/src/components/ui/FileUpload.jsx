import React, { useRef, useState } from 'react';
import { UploadCloud, X, File, AlertCircle } from 'lucide-react';

export default function FileUpload({
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB default
  preview = true,
  onUpload,
  label = 'Upload file',
  helperText = 'PNG, JPG, GIF up to 5MB',
  multiple = false,
  className = '',
}) {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');

  const processFiles = (selectedFiles) => {
    setError('');
    const validFiles = [];
    for (const file of selectedFiles) {
      if (maxSize && file.size > maxSize) {
        setError(`File ${file.name} exceeds maximum size of ${(maxSize / (1024 * 1024)).toFixed(1)}MB`);
        return;
      }
      validFiles.push(file);
    }

    if (multiple) {
      const updated = [...files, ...validFiles];
      setFiles(updated);
      onUpload?.(updated);
    } else if (validFiles.length > 0) {
      setFiles([validFiles[0]]);
      onUpload?.(validFiles[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onUpload?.(multiple ? updated : null);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
            : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center gap-2">
          <UploadCloud className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Click to upload or drag and drop
          </div>
          {helperText && <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-500">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {preview && files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          {files.map((file, idx) => {
            const isImage = file.type.startsWith('image/');
            const objectUrl = isImage ? URL.createObjectURL(file) : null;

            return (
              <div
                key={idx}
                className="relative group border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-gray-800 flex flex-col items-center"
              >
                {isImage ? (
                  <img
                    src={objectUrl}
                    alt={file.name}
                    className="w-full h-20 object-cover rounded-md mb-2"
                    onLoad={() => URL.revokeObjectURL(objectUrl)}
                  />
                ) : (
                  <div className="w-full h-20 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-md mb-2">
                    <File className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <span className="text-xs text-gray-600 dark:text-gray-300 truncate w-full text-center">
                  {file.name}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                  className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 text-white rounded-full opacity-80 hover:opacity-100 shadow-sm"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
