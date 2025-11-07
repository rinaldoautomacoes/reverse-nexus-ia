import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Paperclip, Upload, Loader2, XCircle, FileText, Image as ImageIcon, FileQuestion } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface FileAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface FileUploadFieldProps {
  label?: string;
  initialFiles?: FileAttachment[];
  onFilesChange: (files: FileAttachment[]) => void;
  disabled?: boolean;
}

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) {
    return <ImageIcon className="h-4 w-4" />;
  }
  if (fileType === 'application/pdf') {
    return <FileText className="h-4 w-4" />;
  }
  return <FileQuestion className="h-4 w-4" />;
};

export const FileUploadField: React.FC<FileUploadFieldProps> = ({
  label = "Anexar Arquivos",
  initialFiles = [],
  onFilesChange,
  disabled = false,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [files, setFiles] = useState<FileAttachment[]>(initialFiles);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFiles(initialFiles);
  }, [initialFiles]);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    if (!user?.id) {
      toast({ title: "Erro de autenticação", description: "Usuário não logado. Faça login para anexar arquivos.", variant: "destructive" });
      return;
    }

    setUploading(true);
    const uploadedFileUrls: FileAttachment[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const fileExtension = file.name.split('.').pop();
      const filePath = `${user.id}/attachments/${Date.now()}-${file.name}`;

      try {
        const { data, error } = await supabase.storage
          .from('collection-attachments')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) {
          throw new Error(error.message);
        }

        const { data: publicUrlData } = supabase.storage
          .from('collection-attachments')
          .getPublicUrl(filePath);
        
        uploadedFileUrls.push({
          name: file.name,
          url: publicUrlData.publicUrl,
          type: file.type,
          size: file.size,
        });
        toast({ title: "Upload Concluído", description: `Arquivo "${file.name}" enviado com sucesso.`, duration: 3000 });

      } catch (error: any) {
        console.error("Erro ao fazer upload do arquivo:", error);
        toast({ title: "Erro no Upload", description: `Falha ao enviar "${file.name}": ${error.message}`, variant: "destructive" });
      }
    }

    setFiles(prev => [...prev, ...uploadedFileUrls]);
    onFilesChange([...files, ...uploadedFileUrls]); // Notify parent immediately
    setUploading(false);

    // Clear the file input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [user?.id, toast, files, onFilesChange]);

  const handleRemoveFile = useCallback((urlToRemove: string) => {
    setFiles(prev => {
      const newFiles = prev.filter(file => file.url !== urlToRemove);
      onFilesChange(newFiles); // Notify parent
      return newFiles;
    });
    // TODO: Optionally, delete file from Supabase Storage
  }, [onFilesChange]);

  return (
    <div className="space-y-2">
      <Label htmlFor="file-upload-field">{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id="file-upload-field"
          type="file"
          multiple
          onChange={handleFileSelect}
          className="flex-1"
          disabled={disabled || uploading}
          ref={fileInputRef}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
        </Button>
      </div>
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 border rounded-md bg-muted/20">
              <div className="flex items-center gap-2">
                {getFileIcon(file.type)}
                <a 
                  href={file.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm text-primary hover:underline truncate max-w-[200px] md:max-w-none"
                  title={file.name}
                >
                  {file.name}
                </a>
                <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveFile(file.url)}
                disabled={disabled || uploading}
                className="text-destructive hover:bg-destructive/10"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};