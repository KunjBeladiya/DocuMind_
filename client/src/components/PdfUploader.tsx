import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useChatStore } from '../store/chatStore';

interface PdfUploaderProps {
  chatId: string;
}

export function PdfUploader({ chatId }: PdfUploaderProps) {
  const { uploadPdf, uploadProgress } = useChatStore();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file.');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size must be less than 50MB.');
        return;
      }
      setSelectedFile(file);
      setIsUploading(true);
      setUploadDone(false);
      try {
        await uploadPdf(chatId, file);
        setUploadDone(true);
        toast.success('PDF uploaded successfully! You can now ask questions.');
      } catch {
        toast.error('Upload failed. Please try again.');
        setSelectedFile(null);
      } finally {
        setIsUploading(false);
      }
    },
    [chatId, uploadPdf]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="px-4 py-3 border-t border-slate-800">
      <AnimatePresence mode="wait">
        {uploadDone ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3"
          >
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-emerald-300 text-sm font-medium">Document ready</p>
              <p className="text-emerald-500 text-xs truncate">{selectedFile?.name}</p>
            </div>
            <button
              onClick={() => { setSelectedFile(null); setUploadDone(false); }}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ) : isUploading ? (
          <motion.div
            key="uploading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span className="text-slate-300 text-sm truncate flex-1">{selectedFile?.name}</span>
              <span className="text-blue-400 text-xs font-medium">{uploadProgress ?? 0}%</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-violet-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress ?? 0}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </motion.div>
        ) : (
          <motion.label
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`flex items-center gap-3 border-2 border-dashed rounded-xl px-4 py-3 cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/50'
            }`}
          >
            <Upload className={`w-4 h-4 flex-shrink-0 ${isDragging ? 'text-blue-400' : 'text-slate-500'}`} />
            <div>
              <p className="text-slate-400 text-sm">
                <span className="text-blue-400 font-medium">Upload PDF</span> or drag & drop
              </p>
              <p className="text-slate-600 text-xs">Max 50MB</p>
            </div>
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </motion.label>
        )}
      </AnimatePresence>
    </div>
  );
}
