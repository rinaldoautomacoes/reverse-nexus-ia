"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Bell, Building2, MapPin, Bug, Rat,
  Calendar as CalendarIcon, Clock, User, CheckSquare, Camera, MessageSquare, Loader2,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { ClientCombobox } from '@/components/ClientCombobox'; // Import ClientCombobox
import { ResponsibleUserCombobox } from '@/components/ResponsibleUserCombobox'; // Import ResponsibleUserCombobox
import type { Tables } from '@/integrations/supabase/types'; // Import Tables for types

// Define a interface para os anexos, reutilizando a existente
interface FileAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

// Mapeamento de ícones para tipos de praga
const pestIcons: { [key: string]: React.ElementType } = {
  baratas: Bug,
  ratos: Rat,
  mosquitos: Bug,
  cupins: Bug,
  formigas: Bug,
  aranhas: Bug,
  outros: Bug,
};

// Opções de praga com ícones
const pestOptions = [
  { value: 'baratas', label: 'Baratas', icon: Bug },
  { value: 'ratos', label: 'Ratos', icon: Rat },
  { value: 'mosquitos', label: 'Mosquitos', icon: Bug },
  { value: 'cupins', label: 'Cupins', icon: Bug },
  { value: 'formigas', label: 'Formigas', icon: Bug },
  { value: 'aranhas', label: 'Aranhas', icon: Bug },
  { value: 'outros', label: 'Outros', icon: Bug },
];

export const PestControlService: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [serviceStatus, setServiceStatus] = useState<'agendado' | 'em_andamento' | 'concluido'>('agendado');
  
  // States for ClientCombobox
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientNameDisplay, setClientNameDisplay] = useState<string>('');
  const [clientAddress, setClientAddress] = useState('');
  const [environmentType, setEnvironmentType] = useState('');

  // States for ResponsibleUserCombobox (Technician)
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string | null>(null);
  const [technicianNameDisplay, setTechnicianNameDisplay] = useState<string>('');

  const [selectedPests, setSelectedPests] = useState<string[]>([]);
  const [serviceDate, setServiceDate] = useState<Date | undefined>(new Date());
  const [serviceTime, setServiceTime] = useState('09:00');
  
  const [checklist, setChecklist] = useState({
    inspection: false,
    application: false,
    monitoring: false,
    finalization: false,
  });
  const [observations, setObservations] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegisteringEvidence, setIsRegisteringEvidence] = useState(false);

  const handleClientSelect = useCallback((client: Tables<'clients'> | null) => {
    setSelectedClientId(client?.id || null);
    setClientNameDisplay(client?.name || '');
    setClientAddress(client?.address || '');
    // You might want to derive environmentType from client data or keep it as a manual input
  }, []);

  const handleTechnicianSelect = useCallback((userProfile: Tables<'profiles'> | null) => {
    setSelectedTechnicianId(userProfile?.id || null);
    setTechnicianNameDisplay(userProfile ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() : '');
  }, []);

  const handlePestToggle = useCallback((pestValue: string) => {
    setSelectedPests(prev =>
      prev.includes(pestValue) ? prev.filter(p => p !== pestValue) : [...prev, pestValue]
    );
  }, []);

  const handleFinalizeService = async () => {
    setIsSubmitting(true);
    // Basic validation
    if (!selectedClientId || !clientAddress || !selectedTechnicianId || selectedPests.length === 0 || !serviceDate) {
      toast({
        title: "Campos Obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios (Cliente, Endereço, Técnico, Pragas, Data).",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Simulate API call (replace with actual Supabase insert/update)
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast({
      title: "Serviço Finalizado",
      description: `O serviço para ${clientNameDisplay} foi marcado como ${serviceStatus}.`,
      variant: "success",
    });
    console.log("Service Data:", {
      serviceStatus, selectedClientId, clientNameDisplay, clientAddress, environmentType, selectedPests,
      serviceDate: serviceDate ? format(serviceDate, 'yyyy-MM-dd') : null,
      serviceTime, selectedTechnicianId, technicianNameDisplay, checklist, observations,
    });
    setIsSubmitting(false);
    // Optionally reset form or navigate
    // navigate('/dashboard');
  };

  const handleRegisterEvidence = async () => {
    setIsRegisteringEvidence(true);
    // Simulate opening a camera/gallery or file upload dialog
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: "Registrar Evidências",
      description: "Funcionalidade de registro de fotos e observações em desenvolvimento.",
      variant: "info",
    });
    setIsRegisteringEvidence(false);
  };

  return (
    <div className="min-h-screen bg-background ai-pattern p-6">
      <div className="max-w-4xl mx-auto">
        {/* Adjust navigation as needed */}
        <Button
          onClick={() => navigate('/coletas-dashboard')} // Assuming a general dashboard or pest control dashboard
          variant="ghost"
          className="mb-6 text-primary hover:bg-primary/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Dashboard
        </Button>

        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold font-orbitron gradient-text mb-4">
              Controle de Pragas
            </h1>
            <p className="text-muted-foreground">
              Acompanhamento e gestão de serviços de dedetização.
            </p>
          </div>

          <Card className="card-futuristic">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5 text-primary" />
                Detalhes do Serviço
              </CardTitle>
              <Bell className="h-5 w-5 text-warning-yellow" /> {/* Notification icon */}
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Service Status */}
              <div className="space-y-2">
                <Label htmlFor="service-status">Status do Serviço</Label>
                <Select value={serviceStatus} onValueChange={(value) => setServiceStatus(value as any)}>
                  <SelectTrigger id="service-status" className="pl-10">
                    <CheckCircle className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Selecionar status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agendado">Agendado</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Client Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client-combobox">Nome do Cliente *</Label>
                  <ClientCombobox
                    value={clientNameDisplay}
                    onValueChange={setClientNameDisplay} // Update display value
                    onClientSelect={handleClientSelect} // Handle full client object selection
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-address">Endereço do Cliente *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="client-address"
                      placeholder="Endereço completo"
                      className="pl-10"
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      required
                      disabled={!selectedClientId} // Disable if no client is selected
                    />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="environment-type">Tipo de Ambiente</Label>
                  <Input
                    id="environment-type"
                    placeholder="Ex: Residencial, Comercial, Industrial"
                    value={environmentType}
                    onChange={(e) => setEnvironmentType(e.target.value)}
                  />
                </div>
              </div>

              {/* Pest Type */}
              <div className="space-y-2">
                <Label>Tipo de Praga *</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {pestOptions.map(pest => {
                    const Icon = pest.icon;
                    const isSelected = selectedPests.includes(pest.value);
                    return (
                      <Button
                        key={pest.value}
                        variant={isSelected ? "default" : "outline"}
                        className={cn(
                          "flex items-center gap-2 justify-start",
                          isSelected ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border-muted-foreground text-muted-foreground hover:bg-muted/20"
                        )}
                        onClick={() => handlePestToggle(pest.value)}
                      >
                        <Icon className="h-4 w-4" />
                        {pest.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="service-date">Data do Atendimento *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal pl-10",
                          !serviceDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        {serviceDate ? format(serviceDate, "PPP", { locale: ptBR }) : "Selecionar data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={serviceDate}
                        onSelect={setServiceDate}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-time">Horário do Atendimento</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="service-time"
                      type="time"
                      className="pl-10"
                      value={serviceTime}
                      onChange={(e) => setServiceTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Technician Name */}
              <div className="space-y-2">
                <Label htmlFor="technician-combobox">Técnico Responsável *</Label>
                <ResponsibleUserCombobox
                  value={selectedTechnicianId}
                  onValueChange={setSelectedTechnicianId}
                  onUserSelect={handleTechnicianSelect}
                />
              </div>

              {/* Service Checklist */}
              <div className="space-y-2">
                <Label>Checklist do Serviço</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="inspection"
                      checked={checklist.inspection}
                      onCheckedChange={(checked) => setChecklist(prev => ({ ...prev, inspection: !!checked }))}
                    />
                    <label htmlFor="inspection" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Inspeção
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="application"
                      checked={checklist.application}
                      onCheckedChange={(checked) => setChecklist(prev => ({ ...prev, application: !!checked }))}
                    />
                    <label htmlFor="application" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Aplicação
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="monitoring"
                      checked={checklist.monitoring}
                      onCheckedChange={(checked) => setChecklist(prev => ({ ...prev, monitoring: !!checked }))}
                    />
                    <label htmlFor="monitoring" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Monitoramento
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="finalization"
                      checked={checklist.finalization}
                      onCheckedChange={(checked) => setChecklist(prev => ({ ...prev, finalization: !!checked }))}
                    />
                    <label htmlFor="finalization" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Finalização
                    </label>
                  </div>
                </div>
              </div>

              {/* Observations */}
              <div className="space-y-2">
                <Label htmlFor="observations">Observações Técnicas</Label>
                <Textarea
                  id="observations"
                  placeholder="Detalhes adicionais, recomendações, etc."
                  rows={4}
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRegisterEvidence}
                  disabled={isSubmitting || isRegisteringEvidence}
                  className="border-neural text-neural hover:bg-neural/10"
                >
                  {isRegisteringEvidence ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="mr-2 h-4 w-4" />
                  )}
                  Registrar Evidências
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-primary hover:bg-gradient-primary/80 glow-effect"
                  onClick={handleFinalizeService}
                  disabled={isSubmitting || isRegisteringEvidence}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Finalizar Serviço
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};