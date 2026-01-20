import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { TablesInsert } from '@/integrations/supabase/types_generated';
import type { ColetaImportData, ProductImportData, ClientImportData, TechnicianImportData, SupervisorImportData } from '@/lib/types';

type ColetaInsert = TablesInsert<'coletas'>;
type ProductInsert = TablesInsert<'products'>;
type ClientInsert = TablesInsert<'clients'>;
type ItemInsert = TablesInsert<'items'>;
type ProfileInsert = TablesInsert<'profiles'>;

interface UseImportMutationsProps {
  userId: string | undefined;
  onImportSuccess?: (importedType: 'collections' | 'products' | 'clients' | 'technicians' | 'supervisors') => void;
  onImportError?: (error: Error, type: 'collections' | 'products' | 'clients' | 'technicians' | 'supervisors') => void;
}

export const useImportMutations = ({ userId, onImportSuccess, onImportError }: UseImportMutationsProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidateCommonQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['allProfiles', userId] });
    queryClient.invalidateQueries({ queryKey: ['allProfilesForSupervisor', userId] });
    queryClient.invalidateQueries({ queryKey: ['clients', userId] });
    queryClient.invalidateQueries({ queryKey: ['products', userId] });
    queryClient.invalidateQueries({ queryKey: ['coletas', userId] });
    queryClient.invalidateQueries({ queryKey: ['entregas'] }); // Invalidate all deliveries
    queryClient.invalidateQueries({ queryKey: ['items', userId] });
    queryClient.invalidateQueries({ queryKey: ['coletasAtivas', userId] });
    queryClient.invalidateQueries({ queryKey: ['coletasConcluidas', userId] });
    queryClient.invalidateQueries({ queryKey: ['entregasAtivas', userId] });
    queryClient.invalidateQueries({ queryKey: ['entregasConcluidas', userId] });
    queryClient.invalidateQueries({ queryKey: ['dashboardColetasMetrics', userId] });
    queryClient.invalidateQueries({ queryKey: ['entregasForMetrics', userId] });
    queryClient.invalidateQueries({ queryKey: ['entregasAtivasStatusChart', userId] });
    queryClient.invalidateQueries({ queryKey: ['entregasAtivasStatusDonutChart', userId] });
    queryClient.invalidateQueries({ queryKey: ['allColetasForGeneralDashboard', userId] });
    queryClient.invalidateQueries({ queryKey: ['collectionStatusChart', userId] });
    queryClient.invalidateQueries({ queryKey: ['productStatusChart', userId] });
  };

  const importCollectionsMutation = useMutation({
    mutationFn: async (dataToImport: ColetaImportData[]) => {
      if (!userId) throw new Error('Usuário não autenticado. Faça login para importar dados.');

      const inserts: ColetaInsert[] = dataToImport.map(item => ({
        user_id: userId,
        unique_number: item.unique_number,
        client_control: item.client_control,
        parceiro: item.parceiro,
        contato: item.contato,
        telefone: item.telefone,
        email: item.email,
        cnpj: item.cnpj,
        endereco_origem: item.endereco_origem,
        cep_origem: item.cep_origem,
        origin_address_number: item.origin_address_number,
        endereco_destino: item.endereco_destino,
        cep_destino: item.cep_destino,
        destination_address_number: item.destination_address_number,
        origin_lat: item.origin_lat,
        origin_lng: item.origin_lng,
        destination_lat: item.destination_lat,
        destination_lng: item.destination_lng,
        previsao_coleta: item.previsao_coleta,
        qtd_aparelhos_solicitado: item.qtd_aparelhos_solicitado,
        modelo_aparelho: item.modelo_aparelho,
        freight_value: item.freight_value,
        observacao: item.observacao,
        status_coleta: item.status_coleta,
        type: item.type,
        contrato: item.contrato,
        nf_glbl: item.nf_glbl,
        partner_code: item.partner_code,
      }));

      const { data: insertedColetas, error: coletasError } = await supabase.from('coletas').insert(inserts).select('id, status_coleta');
      if (coletasError) throw new Error(coletasError.message);

      const itemsToInsert: ItemInsert[] = [];
      insertedColetas.forEach((coleta, index) => {
        const originalItemData = dataToImport[index];
        if (originalItemData.modelo_aparelho && originalItemData.qtd_aparelhos_solicitado && originalItemData.qtd_aparelhos_solicitado > 0) {
          itemsToInsert.push({
            user_id: userId,
            collection_id: coleta.id,
            name: originalItemData.modelo_aparelho,
            description: originalItemData.modelo_aparelho,
            quantity: originalItemData.qtd_aparelhos_solicitado,
            status: coleta.status_coleta || 'pendente',
          });
        }
      });

      if (itemsToInsert.length > 0) {
        const { error: itemsError } = await supabase.from('items').insert(itemsToInsert);
        if (itemsError) throw new Error(itemsError.message);
      }

      return insertedColetas.length;
    },
    onSuccess: (count) => {
      invalidateCommonQueries();
      toast({ title: 'Importação de Coletas/Entregas concluída!', description: `${count} registros foram salvos com sucesso no banco de dados.` });
      onImportSuccess?.('collections');
    },
    onError: (error) => {
      toast({ title: 'Erro na importação de Coletas/Entregas', description: error.message, variant: 'destructive' });
      onImportError?.(error, 'collections');
    },
  });

  const importProductsMutation = useMutation({
    mutationFn: async (dataToImport: ProductImportData[]) => {
      if (!userId) throw new Error('Usuário não autenticado. Faça login para importar produtos.');

      const inserts: ProductInsert[] = dataToImport.map(item => ({
        user_id: userId,
        code: item.code,
        description: item.description,
        model: item.model,
        serial_number: item.serial_number,
      }));

      const { error } = await supabase
        .from('products')
        .upsert(inserts, { onConflict: 'code,user_id', ignoreDuplicates: true });
      
      if (error) throw new Error(error.message);
      return inserts.length;
    },
    onSuccess: (count) => {
      invalidateCommonQueries();
      toast({ title: 'Importação de Produtos concluída!', description: `${count} produtos foram salvos com sucesso no banco de dados, duplicatas foram ignoradas.` });
      onImportSuccess?.('products');
    },
    onError: (error) => {
      toast({ title: 'Erro na importação de Produtos', description: error.message, variant: 'destructive' });
      onImportError?.(error, 'products');
    },
  });

  const importClientsMutation = useMutation({
    mutationFn: async (dataToImport: ClientImportData[]) => {
      if (!userId) throw new Error('Usuário não autenticado. Faça login para importar clientes.');

      const validClients = dataToImport.filter(client => client.name && client.name.trim() !== '');
      if (validClients.length === 0) {
        throw new Error('Nenhum cliente válido encontrado para importação. Certifique-se de que a coluna "Nome" ou "Nome do Cliente" não está vazia.');
      }

      const inserts: ClientInsert[] = validClients.map(item => ({
        user_id: userId,
        name: item.name,
        phone: item.phone,
        email: item.email,
        address: item.address,
        address_number: item.address_number,
        cep: item.cep,
        cnpj: item.cnpj,
        contact_person: item.contact_person,
      }));

      const { error } = await supabase
        .from('clients')
        .upsert(inserts, { onConflict: 'name,user_id', ignoreDuplicates: true });
      
      if (error) throw new Error(error.message);
      return inserts.length;
    },
    onSuccess: (count) => {
      invalidateCommonQueries();
      toast({ title: 'Importação de Clientes concluída!', description: `${count} clientes foram salvos com sucesso no banco de dados, duplicatas foram ignoradas.` });
      onImportSuccess?.('clients');
    },
    onError: (error) => {
      toast({ title: 'Erro na importação de Clientes', description: error.message, variant: 'destructive' });
      onImportError?.(error, 'clients');
    },
  });

  const importTechniciansMutation = useMutation({
    mutationFn: async (dataToImport: TechnicianImportData[]) => {
      if (!userId) throw new Error('Usuário não autenticado. Faça login para importar técnicos.');

      const inserts: ProfileInsert[] = dataToImport.map(tech => ({
        id: crypto.randomUUID(),
        first_name: tech.first_name,
        last_name: tech.last_name,
        phone_number: tech.phone_number,
        role: tech.role || 'standard',
        supervisor_id: tech.supervisor_id,
        avatar_url: null,
        updated_at: new Date().toISOString(),
        team_shift: tech.team_shift || 'day',
        address: tech.address || null,
      }));

      const { error } = await supabase
        .from('profiles')
        .upsert(inserts, { onConflict: 'first_name,last_name,phone_number', ignoreDuplicates: true });
      
      if (error) throw new Error(error.message);
      return inserts.length;
    },
    onSuccess: (count) => {
      invalidateCommonQueries();
      toast({ title: 'Importação de Técnicos concluída!', description: `${count} técnicos foram salvos com sucesso no banco de dados.` });
      onImportSuccess?.('technicians');
    },
    onError: (error) => {
      toast({ title: 'Erro na importação de Técnicos', description: error.message, variant: 'destructive' });
      onImportError?.(error, 'technicians');
    },
  });

  const importSupervisorsMutation = useMutation({
    mutationFn: async (dataToImport: SupervisorImportData[]) => {
      if (!userId) throw new Error('Usuário não autenticado. Faça login para importar supervisores.');

      const inserts: ProfileInsert[] = dataToImport.map(supervisor => ({
        id: crypto.randomUUID(),
        first_name: supervisor.first_name,
        last_name: supervisor.last_name,
        phone_number: supervisor.phone_number,
        role: supervisor.role || 'standard',
        supervisor_id: null, // Supervisores não têm supervisor
        avatar_url: null,
        updated_at: new Date().toISOString(),
        team_shift: supervisor.team_shift || 'day',
        address: supervisor.address || null,
      }));

      const { error } = await supabase
        .from('profiles')
        .upsert(inserts, { onConflict: 'first_name,last_name,phone_number', ignoreDuplicates: true });
      
      if (error) throw new Error(error.message);
      return inserts.length;
    },
    onSuccess: (count) => {
      invalidateCommonQueries();
      toast({ title: 'Importação de Supervisores concluída!', description: `${count} supervisores foram salvos com sucesso no banco de dados.` });
      onImportSuccess?.('supervisors');
    },
    onError: (error) => {
      toast({ title: 'Erro na importação de Supervisores', description: error.message, variant: 'destructive' });
      onImportError?.(error, 'supervisors');
    },
  });

  const isImportPending =
    importCollectionsMutation.isPending ||
    importProductsMutation.isPending ||
    importClientsMutation.isPending ||
    importTechniciansMutation.isPending ||
    importSupervisorsMutation.isPending;

  return {
    importCollectionsMutation,
    importProductsMutation,
    importClientsMutation,
    importTechniciansMutation,
    importSupervisorsMutation,
    isImportPending,
  };
};