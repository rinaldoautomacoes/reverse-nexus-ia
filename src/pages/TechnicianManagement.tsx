import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Edit, Trash2, Users, Search, User as UserIcon, Phone, Briefcase, Loader2, UserCog, Sun, Moon, Square, CheckSquare, MapPin, FileText, MessageSquare, Send } from "lucide-react"; // Adicionado MessageSquare e Send
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { CreateProfileDialog } from "@/components/CreateProfileDialog";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { CreateTechnicianReportDialog } from "@/components/CreateTechnicianReportDialog";

type Profile = Tables<'profiles'>;

export const TechnicianManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user: currentUser, profile: currentProfile } = useAuth(); // Obter o perfil do usuário logado

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState<Profile | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTechnicianIds, setSelectedTechnicianIds] = useState<Set<string>>(new Set());

  const { data: allProfiles, isLoading: isLoadingProfiles, error: profilesError } = useQuery<Profile[], Error>({
    queryKey: ['allProfiles', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('first_name', { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!currentUser?.id,
  });

  const technicians = allProfiles?.filter(profile => profile.role === 'standard' && profile.supervisor_id !== null) || [];

  const deleteTechnicianMutation = useMutation({
    mutationFn: async (technicianId: string) => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', technicianId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allProfiles', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['allProfilesForSupervisor', currentUser?.id] });
      toast({ title: "Técnico excluído!", description: "Técnico removido com sucesso." });
    },
    onError: (err) => {
      toast({ title: "Erro ao excluir técnico", description: err.message, variant: "destructive" });
    },
  });

  const bulkDeleteTechniciansMutation = useMutation({
    mutationFn: async (technicianIds: string[]) => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .in('id', technicianIds);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allProfiles', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['allProfilesForSupervisor', currentUser?.id] });
      setSelectedTechnicianIds(new Set());
      toast({ title: "Técnicos excluídos!", description: `${selectedTechnicianIds.size} técnicos removidos com sucesso.` });
    },
    onError: (err) => {
      toast({ title: "Erro ao excluir técnicos", description: err.message, variant: "destructive" });
    },
  });

  const handleEditTechnician = (technician: Profile) => {
    setEditingTechnician(technician);
    setIsEditDialogOpen(true);
  };

  const handleDeleteTechnician = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este técnico? Esta ação não pode ser desfeita.")) {
      deleteTechnicianMutation.mutate(id);
    }
  };

  const handleBulkDeleteTechnicians = () => {
    if (selectedTechnicianIds.size === 0) {
      toast({ title: "Nenhum técnico selecionado", description: "Selecione os técnicos que deseja excluir.", variant: "warning" });
      return;
    }
    if (window.confirm(`Tem certeza que deseja excluir ${selectedTechnicianIds.size} técnicos selecionados? Esta ação não pode ser desfeita.`)) {
      bulkDeleteTechniciansMutation.mutate(Array.from(selectedTechnicianIds));
    }
  };

  const handleToggleSelectTechnician = (technicianId: string) => {
    setSelectedTechnicianIds(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(technicianId)) {
        newSelection.delete(technicianId);
      } else {
        newSelection.add(technicianId);
      }
      return newSelection;
    });
  };

  const handleSelectAllTechnicians = () => {
    if (selectedTechnicianIds.size === filteredTechnicians.length) {
      setSelectedTechnicianIds(new Set());
    } else {
      const allTechnicianIds = new Set(filteredTechnicians.map(t => t.id));
      setSelectedTechnicianIds(allTechnicianIds);
    }
  };

  const handleWhatsAppClick = (technician: Profile) => {
    if (technician.personal_phone_number) { // Usar personal_phone_number
      const cleanedPhone = technician.personal_phone_number.replace(/\D/g, '');
      const userName = currentProfile?.first_name || 'Usuário';
      const message = `Olá ${technician.first_name || 'Técnico'},\n\nMe chamo ${userName}, representante da LogiReverseIA. Gostaria de conversar sobre suas atividades como técnico. Quando possível, me retorne. Desde já agradeço.`;
      window.open(`https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      toast({ title: "Dados incompletos", description: "Telefone pessoal do técnico não disponível.", variant: "destructive" });
    }
  };

  const handleEmailClick = (technician: Profile) => {
    // O email não está diretamente no perfil, mas se fosse, seria assim:
    // if (technician.email) {
    //   const subject = encodeURIComponent("Contato referente à LogiReverseIA");
    //   const userName = currentProfile?.first_name || 'Usuário';
    //   const body = encodeURIComponent(`Olá ${technician.first_name || 'Técnico'},\n\nMe chamo ${userName}, representante da LogiReverseIA. Gostaria de conversar sobre suas atividades como técnico. Quando possível, me retorne. Desde já agradeço.`);
    //   window.open(`mailto:${technician.email}?subject=${subject}&body=${body}`, '_blank');
    // } else {
    //   toast({ title: "Dados incompletos", description: "Email do técnico não disponível.", variant: "destructive" });
    // }
    toast({ title: "Funcionalidade em desenvolvimento", description: "O envio de e-mail para técnicos ainda não está disponível.", variant: "info" });
  };

  const filteredTechnicians = technicians?.filter(technician =>
    technician.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    technician.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    technician.phone_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    technician.personal_phone_number?.toLowerCase().includes(searchTerm.toLowerCase()) || // Incluído o novo campo na busca
    technician.team_shift?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    technician.team_name?.toLowerCase().includes(searchTerm.toLowerCase()) || // Incluído o novo campo na busca
    technician.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (technician.supervisor_id && allProfiles?.find(s => s.id === technician.supervisor_id)?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const isAnyTechnicianSelected = selectedTechnicianIds.size > 0;
  const isAllTechniciansSelected = filteredTechnicians.length > 0 && selectedTechnicianIds.size === filteredTechnicians.length;

  if (isLoadingProfiles) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando técnicos...</p>
        </div>
      </div>
    );
  }

  if (profilesError) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6">
        <div className="max-w-6xl mx-auto text-center text-destructive">
          <p>Erro ao carregar técnicos: {profilesError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background ai-pattern p-6">
      <div className="max-w-6xl mx-auto">
        <Button
          onClick={() => navigate('/')}
          variant="ghost"
          className="mb-6 text-primary hover:bg-primary/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Dashboard
        </Button>

        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold font-orbitron gradient-text mb-4">
              Gerenciar Técnicos
            </h1>
            <p className="text-muted-foreground">
              Adicione, edite e remova os técnicos da sua equipe que possuem um supervisor.
            </p>
          </div>

          {/* Card para o quantitativo geral de técnicos */}
          <Card className="card-futuristic">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Técnicos Cadastrados
              </CardTitle>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <UserCog className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-orbitron gradient-text">
                {technicians.length}
              </div>
              <p className="text-xs text-muted-foreground">Técnicos ativos na plataforma</p>
            </CardContent>
          </Card>

          <Card className="card-futuristic">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por nome, sobrenome, telefone, equipe, endereço ou supervisor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-futuristic">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5 text-primary" />
                Meus Técnicos
              </CardTitle>
              <div className="flex gap-2">
                {isAnyTechnicianSelected && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleBulkDeleteTechnicians}
                    disabled={bulkDeleteTechniciansMutation.isPending}
                    className="bg-destructive hover:bg-destructive/80"
                  >
                    {bulkDeleteTechniciansMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Excluir Selecionados ({selectedTechnicianIds.size})
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSelectAllTechnicians}
                  disabled={filteredTechnicians.length === 0}
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  {isAllTechniciansSelected ? (
                    <Square className="mr-2 h-4 w-4" />
                  ) : (
                    <CheckSquare className="mr-2 h-4 w-4" />
                  )}
                  {isAllTechniciansSelected ? "Desselecionar Todos" : "Selecionar Todos"}
                </Button>
                {/* Botão para gerar relatório */}
                {allProfiles && ( // Renderiza o diálogo apenas se allProfiles estiver carregado
                  <CreateTechnicianReportDialog technicians={technicians} allProfiles={allProfiles} />
                )}
                <CreateProfileDialog profileType="technician" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredTechnicians && filteredTechnicians.length > 0 ? (
                filteredTechnicians.map((technician, index) => (
                  <div
                    key={technician.id}
                    className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 rounded-lg border border-primary/10 bg-slate-darker/10 animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0 mb-3 lg:mb-0">
                      <Checkbox
                        checked={selectedTechnicianIds.has(technician.id)}
                        onCheckedChange={() => handleToggleSelectTechnician(technician.id)}
                        id={`select-technician-${technician.id}`}
                        className="h-5 w-5"
                      />
                      <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <UserIcon className="h-5 w-5 text-primary" />
                          {technician.first_name} {technician.last_name}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" /> Função: {technician.role === 'standard' ? 'Técnico' : technician.role}
                          </div>
                          {technician.phone_number && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" /> Empresa: {technician.phone_number}
                            </div>
                          )}
                          {technician.personal_phone_number && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" /> Pessoal: {technician.personal_phone_number}
                            </div>
                          )}
                          {technician.team_shift && (
                            <div className="flex items-center gap-1">
                              {technician.team_shift === 'day' ? (
                                <Sun className="h-3 w-3" />
                              ) : (
                                <Moon className="h-3 w-3" />
                              )}
                              Equipe: {technician.team_shift === 'day' ? 'Dia' : 'Noite'}
                              {technician.team_name && <span className="ml-1">({technician.team_name})</span>} {/* Exibindo o nome da equipe */}
                            </div>
                          )}
                          {technician.supervisor_id && (
                            <div className="flex items-center gap-1">
                              <UserCog className="h-3 w-3" /> Supervisor: {allProfiles?.find(s => s.id === technician.supervisor_id)?.first_name || 'N/A'}
                            </div>
                          )}
                          {technician.address && (
                            <div className="flex items-center gap-1 col-span-full">
                              <MapPin className="h-3 w-3" /> Endereço: {technician.address}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-accent text-accent hover:bg-accent/10"
                        onClick={() => {
                          setEditingTechnician(technician);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="mr-1 h-3 w-3" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-success-green text-success-green hover:bg-success-green/10"
                        onClick={() => handleWhatsAppClick(technician)}
                        disabled={!technician.personal_phone_number}
                      >
                        <MessageSquare className="mr-1 h-3 w-3" />
                        WhatsApp
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-neural text-neural hover:bg-neural/10"
                        onClick={() => handleEmailClick(technician)}
                        disabled={!technician.email}
                      >
                        <Send className="mr-1 h-3 w-3" />
                        E-mail
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-destructive text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteTechnician(technician.id)}
                        disabled={deleteTechnicianMutation.isPending}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  <UserCog className="h-12 w-12 mx-auto mb-4" />
                  <p>Nenhum técnico cadastrado com supervisor. Clique em "Novo Técnico" para adicionar um.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {editingTechnician && (
        <EditProfileDialog
          profile={editingTechnician}
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setEditingTechnician(null);
          }}
          profileType="technician"
        />
      )}
    </div>
  );
};