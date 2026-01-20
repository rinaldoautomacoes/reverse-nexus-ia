"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Paperclip, Download, FileText, Image as ImageIcon, FileQuestion } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface FileAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface CollectionAttachmentsDialogProps {
  collectionName: string;
  attachments: FileAttachment[] | null; // Permitir null para segurança
  isOpen: boolean;
  onClose: () => void;
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

export const CollectionAttachmentsDialog: React.FC<CollectionAttachmentsDialogProps> = ({
  collectionName,
  attachments,
  isOpen,
  onClose,
}) => {
  // Filtra quaisquer anexos nulos ou indefinidos antes de mapear
  const validAttachments = attachments?.filter(file => 
    file && typeof file.size === 'number' && file.name && file.url && file.type
  ) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-primary/20 max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 gradient-text">
            <Paperclip className="h-5 w-5" />
            Anexos da {collectionName}
          </DialogTitle>
          <DialogDescription>
            Visualize e baixe os arquivos anexados a esta operação.
          </DialogDescription>
        </DialogHeader>
        
        {validAttachments.length > 0 ? (
          <ScrollArea className="flex-1 pr-4 -mr-4">
            <div className="space-y-3 py-2">
              {validAttachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-md bg-muted/20">
                  <div className="flex items-center gap-2 min-w-0">
                    {getFileIcon(file.type)}
                    <span className="text-sm text-foreground truncate" title={file.name}>
                      {file.name}
                    </span>
                    <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <a href={file.url} target="_blank" rel="noopener noreferrer" download={file.name}>
                    <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10">
                      <Download className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center text-muted-foreground py-8">
            <div>
              <Paperclip className="h-12 w-12 mx-auto mb-4" />
              <p>Nenhum anexo encontrado para esta operação.</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};