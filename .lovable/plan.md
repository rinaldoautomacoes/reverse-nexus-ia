
# Plano: Corrigir persistencia e exibicao de Placa e Modelo da Moto

## Problema Identificado

A view `profiles_with_email` no banco de dados nao inclui os campos `motorcycle_model` e `license_plate`. Quando a pagina de tecnicos recarrega os dados apos salvar, ela usa essa view, que retorna os dados sem esses campos. Resultado: os valores sao salvos no banco, mas nao aparecem na interface apos recarregar.

## Solucao

### 1. Atualizar a view `profiles_with_email` (migracao SQL)

Recriar a view adicionando os campos `motorcycle_model` e `license_plate`:

```sql
CREATE OR REPLACE VIEW profiles_with_email AS
SELECT
  p.id, p.first_name, p.last_name, p.avatar_url, p.updated_at,
  p.phone_number, p.personal_phone_number, p.role, p.supervisor_id,
  p.address, p.team_shift, p.team_name,
  p.motorcycle_model, p.license_plate,
  au.email AS user_email
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id;
```

### 2. Corrigir erros de build pre-existentes

Corrigir os seguintes erros que impedem a compilacao:

- **ClientCombobox / ResponsibleUserCombobox**: Adicionar prop `disabled` nas interfaces desses componentes.
- **RouteMap.tsx**: Corrigir conflito de tipo `Route` usando tipagem local adequada.
- **AutomaticCollectionForm.tsx**: Corrigir tipagem de `handleInputChange` e prop `onClientSelect`.
- **GeneralMetricsCards.tsx**: Usar type assertion para `"coleta" | "entrega"`.
- **ManageOutstandingItemsDialog.tsx**: Passar props `onEdit`, `onDelete`, `isDeleting` ao componente.
- **MetricDetailsDialog.tsx**: Corrigir variante de badge de `"warning"` para `"default"`.
- **MainProductAndDateSection.tsx**: Corrigir campos `modelo_aparelho` inexistentes no tipo.
- **ClientDetailsSection / ResponsibleUserSection / ColetaClientDetails**: Remover ou adicionar prop `disabled`.

## Detalhes Tecnicos

- A migracao SQL sera executada via ferramenta de migracao do Supabase
- Nenhuma alteracao na tabela base `profiles` e necessaria (os campos ja existem)
- Apos a migracao, a query `select('*')` na TechnicianPage ja trara os campos automaticamente
- Os casts `(technician as any).motorcycle_model` na TechnicianPage poderao ser removidos
