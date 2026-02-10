import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, Search, Edit, Trash2, Loader2, Package, FileText, Tag, Clock, CheckCircle, XCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { EditDebtRecordDialog } from './EditDebtRecordDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type DebtRecord = Tables<'debt_records'>;

interface DebtItem {
  id: string;
  code: string;
  description: string;
  quantity: number;
}

interface DebtRecordsListProps {
  selectedYear: string; // Assuming we might filter by year later
}

export const DebtRecordsList: React.FC<DebtRecordsListProps> = ({ selectedYear }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDebtRecord, setEditingDebtRecord] = useState<DebtRecord | null>(null);

  const { data: debtRecords, isLoading, error } = useQuery<DebtRecord[], Error>({
    queryKey: ['debtRecords', user?.id, selectedYear],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('debt_records')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', `${selectedYear}-01-01T00:00:00.000Z`)
        .lte('created_at', `${parseInt(selectedYear) + 1}-01-01T00:00:00.000Z`)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user?.id,
  });

  const deleteDebtRecordMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const { error } = await supabase
        .from('debt_records')
        .delete()
        .eq('id', recordId)
        .eq('user_id', user?.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debtRecords', user?.id] });
      toast({ title: "Registro Excluído!", description: "Saldo devedor removido com sucesso." });
    },
    onError: (err) => {
      toast({ title: "Erro ao excluir registro", description: err.message, variant: "destructive" });
    },
  });

  const handleDeleteRecord = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este registro de saldo devedor? Esta ação não pode ser desfeita.")) {
      deleteDebtRecordMutation.mutate(id);
    }
  };

  const handleEditRecord = (record: DebtRecord) => {
    setEditingDebtRecord(record);
    setIsEditDialogOpen(true);
  };

  const filteredRecords = debtRecords?.filter(record =>
    record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (record.item_details as unknown as DebtItem[])?.some(item =>
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="outline" className="bg-destructive/20 text-destructive"><Clock className="h-3 w-3 mr-1" /> Pendente</Badge>;
      case 'pago':
        return <Badge variant="outline" className="bg-success-green/20 text-success-green"><CheckCircle className="h-3 w-3 mr-1" /> Pago</Badge>;
      case 'cancelado':
        return <Badge variant="outline" className="bg-muted/20 text-muted-foreground"><XCircle className="h-3 w-3 mr-1" /> Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card className="card-futuristic border-0 animate-pulse">
        <CardHeader>
          <CardTitle className="h-6 w-48 bg-muted rounded" />
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="card-futuristic border-0">
        <CardContent className="p-6 text-center text-destructive">
          Erro ao carregar saldos devedores: {error.message}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-futuristic">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Saldos Devedores
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por título, notas, status ou itens..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {filteredRecords && filteredRecords.length > 0 ? (
          <div className="space-y-4">
            {filteredRecords.map((record, index) => (
              <div
                key={record.id}
                className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 rounded-lg border border-primary/10 bg-slate-darker/10 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex-1 min-w-0 mb-3 lg:mb-0">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    {record.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Valor: <span className="font-bold text-foreground">R$ {record.amount.toFixed(2)}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Status: {getStatusBadge(record.status)}
                  </p>
                  {record.notes && (
                    <p className="text-xs text-muted-foreground mt-1">Notas: {record.notes}</p>
                  )}
                  {(record.item_details as unknown as DebtItem[])?.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <p className="font-semibold text-foreground">Itens:</p>
                      <ul className="list-disc list-inside ml-2">
                        {(record.item_details as unknown as DebtItem[]).map((item, itemIndex) => (
                          <li key={itemIndex}>
                            {item.quantity}x {item.code} - {item.description}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Criado em: {record.created_at ? format(new Date(record.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'N/A'}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-accent text-accent hover:bg-accent/10"
                    onClick={() => handleEditRecord(record)}
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-destructive text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteRecord(record.id)}
                    disabled={deleteDebtRecordMutation.isPending}
                  >
                    {deleteDebtRecordMutation.isPending ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="mr-1 h-3 w-3" />
                    )}
                    Excluir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-4" />
            <p>Nenhum registro de saldo devedor encontrado.</p>
            <p className="text-sm">Clique em "Novo Saldo Devedor" para adicionar um.</p>
          </div>
        )}
      </CardContent>

      {editingDebtRecord && (
        <EditDebtRecordDialog
          debtRecord={editingDebtRecord}
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setEditingDebtRecord(null);
          }}
        />
      )}
    </Card>
  );
};