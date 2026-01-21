"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageSquare, Mail, Phone, Briefcase, User as UserIcon } from 'lucide-react';
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

  const handleWhatsAppClick = (phoneNumber: string | null | undefined) => {
    if (phoneNumber) {
      const cleanedPhone = phoneNumber.replace(/\D/g, '');
      const message = `Olá ${technicianName}, tudo bem? Gostaria de entrar em contato sobre assuntos relacionados à LogiReverseIA.`;
      window.open(`https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`, '_blank');
      onClose();
    } else {
      toast({ title: "Telefone não disponível", description: "O número de telefone selecionado não está disponível.", variant: "destructive" });
    }
  };

  const handleEmailClick = () => {
    if (email) {
      const subject = encodeURIComponent("Contato sobre LogiReverseIA");
      const body = encodeURIComponent(`Olá ${technicianName},\n\nGostaria de entrar em contato sobre assuntos relacionados à LogiReverseIA.\n\nAtenciosamente,`);
      window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
      onClose();
    } else {
      toast({ title: "Email não disponível", description: "O endereço de e-mail do técnico não está disponível.", variant: "destructive" });
    }
  };

  const hasCompanyPhone = !!companyPhoneNumber && companyPhoneNumber.trim() !== '';
  const hasPersonalPhone = !!personalPhoneNumber && personalPhoneNumber.trim() !== '';
  const hasEmail = !!email && email.trim() !== '';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 gradient-text">
            <MessageSquare className="h-5 w-5" />
            Enviar Mensagem para {technicianName}
          </DialogTitle>
          <DialogDescription>
            Selecione como você gostaria de entrar em contato com {technicianName}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <h4 className="text-sm font-semibold text-muted-foreground">Via WhatsApp:</h4>
          <div className="flex flex-col gap-2">
            {hasCompanyPhone ? (
              <Button
                variant="outline"
                className="w-full justify-start border-success-green text-success-green hover:bg-success-green/10"
                onClick={() => handleWhatsAppClick(companyPhoneNumber)}
              >
                <Phone className="mr-2 h-4 w-4" />
                Telefone da Empresa ({companyPhoneNumber})
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Telefone da Empresa não disponível.
              </p>
            )}
            {hasPersonalPhone ? (
              <Button
                variant="outline"
                className="w-full justify-start border-success-green text-success-green hover:bg-success-green/10"
                onClick={() => handleWhatsAppClick(personalPhoneNumber)}
              >
                <UserIcon className="mr-2 h-4 w-4" />
                Telefone Pessoal ({personalPhoneNumber})
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                Telefone Pessoal não disponível.
              </p>
            )}
            {!hasCompanyPhone && !hasPersonalPhone && (
              <p className="text-sm text-destructive flex items-center gap-2">
                <Phone className="h-4 w-4 text-destructive" />
                Nenhum telefone disponível para WhatsApp.
              </p>
            )}
          </div>

          <h4 className="text-sm font-semibold text-muted-foreground mt-4">Via E-mail:</h4>
          {hasEmail ? (
            <Button
              variant="outline"
              className="w-full justify-start border-neural text-neural hover:bg-neural/10"
              onClick={handleEmailClick}
            >
              <Mail className="mr-2 h-4 w-4" />
              E-mail ({email})
            </Button>
          ) : (
            <p className="text-sm text-destructive flex items-center gap-2">
              <Mail className="h-4 w-4 text-destructive" />
              E-mail não disponível.
            </p>
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