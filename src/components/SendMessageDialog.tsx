"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageSquare, Mail, Phone, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SendMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  technicianName: string;
  companyPhoneNumber: string | null | undefined;
  personalPhoneNumber: string | null | undefined;
  email: string | null | undefined;
}

export const SendMessageDialog: React.FC<SendMessageDialogProps> = ({
  isOpen,
  onClose,
  technicianName,
  companyPhoneNumber,
  personalPhoneNumber,
  email,
}) => {
  const { toast } = useToast();

  const cleanPhoneNumber = (phone: string | null | undefined): string | null => {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length > 0 ? cleaned : null;
  };

  const handleWhatsAppClick = (phoneNumber: string | null | undefined) => {
    const cleaned = cleanPhoneNumber(phoneNumber);
    if (cleaned) {
      const message = `Olá ${technicianName}, estou entrando em contato da LogiReverseIA.`;
      window.open(`https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      toast({ title: "Número de WhatsApp não disponível", description: "Não foi possível encontrar um número de telefone válido para WhatsApp.", variant: "destructive" });
    }
  };

  const handleEmailClick = (emailAddress: string | null | undefined) => {
    if (emailAddress) {
      const subject = encodeURIComponent("Contato da LogiReverseIA");
      const body = encodeURIComponent(`Olá ${technicianName},\n\nEstou entrando em contato da LogiReverseIA.`);
      window.open(`mailto:${emailAddress}?subject=${subject}&body=${body}`, '_blank');
    } else {
      toast({ title: "Email não disponível", description: "Não foi possível encontrar um endereço de email válido.", variant: "destructive" });
    }
  };

  const hasAnyContact = companyPhoneNumber || personalPhoneNumber || email;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 gradient-text">
            <MessageSquare className="h-5 w-5" />
            Enviar Mensagem para {technicianName}
          </DialogTitle>
          <DialogDescription>
            Selecione o método de contato para enviar uma mensagem.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {!hasAnyContact && (
            <div className="text-center text-muted-foreground">
              <XCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <p>Nenhuma informação de contato disponível para {technicianName}.</p>
            </div>
          )}

          {companyPhoneNumber && (
            <Button
              variant="outline"
              className="w-full justify-start border-success-green text-success-green hover:bg-success-green/10"
              onClick={() => handleWhatsAppClick(companyPhoneNumber)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              WhatsApp (Empresa): {companyPhoneNumber}
            </Button>
          )}

          {personalPhoneNumber && (
            <Button
              variant="outline"
              className="w-full justify-start border-success-green text-success-green hover:bg-success-green/10"
              onClick={() => handleWhatsAppClick(personalPhoneNumber)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              WhatsApp (Pessoal): {personalPhoneNumber}
            </Button>
          )}

          {email && (
            <Button
              variant="outline"
              className="w-full justify-start border-neural text-neural hover:bg-neural/10"
              onClick={() => handleEmailClick(email)}
            >
              <Mail className="mr-2 h-4 w-4" />
              Email: {email}
            </Button>
          )}
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};