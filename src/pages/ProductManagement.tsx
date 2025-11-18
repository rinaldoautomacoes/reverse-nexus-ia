import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, PlusCircle, Edit, Trash2, Package, Search, Tag, Box, Hash, Image as ImageIcon, CheckSquare, Square, Loader2 } from "lucide-react"; // Adicionado Loader2 aqui
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { ProductForm } from "@/components/ProductForm";
import { Checkbox } from "@/components/ui/checkbox"; // Importar Checkbox

type Product = Tables<'products'>;
type ProductInsert = TablesInsert<'products'>;
type ProductUpdate = TablesUpdate<'products'>;

export const ProductManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set()); // Estado para IDs selecionados

  const { data: products, isLoading: isLoadingProducts, error: productsError } = useQuery<Product[], Error>({
    queryKey: ['products', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('code', { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user?.id,
  });

  const addProductMutation = useMutation({
    mutationFn: async (newProduct: ProductInsert) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado. Faça login para adicionar produtos.");
      }
      const { data, error } = await supabase
        .from('products')
        .insert({ ...newProduct, user_id: user.id })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', user?.id] });
      toast({ title: "Produto adicionado!", description: "Novo produto criado com sucesso." });
      setIsAddDialogOpen(false);
    },
    onError: (err) => {
      toast({ title: "Erro ao adicionar produto", description: err.message, variant: "destructive" });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (updatedProduct: ProductUpdate) => {
      const { data, error } = await supabase
        .from('products')
        .update(updatedProduct)
        .eq('id', updatedProduct.id as string)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', user?.id] });
      toast({ title: "Produto atualizado!", description: "Produto salvo com sucesso." });
      setIsEditDialogOpen(false);
      setEditingProduct(null);
    },
    onError: (err) => {
      toast({ title: "Erro ao atualizar produto", description: err.message, variant: "destructive" });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', user?.id] });
      toast({ title: "Produto excluído!", description: "Produto removido com sucesso." });
    },
    onError: (err) => {
      toast({ title: "Erro ao excluir produto", description: err.message, variant: "destructive" });
    },
  });

  const bulkDeleteProductsMutation = useMutation({
    mutationFn: async (productIds: string[]) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', productIds);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', user?.id] });
      setSelectedProductIds(new Set()); // Limpa a seleção após a exclusão
      toast({ title: "Produtos excluídos!", description: `${selectedProductIds.size} produtos removidos com sucesso.` });
    },
    onError: (err) => {
      toast({ title: "Erro ao excluir produtos", description: err.message, variant: "destructive" });
    },
  });

  const handleAddProduct = (data: ProductInsert) => {
    addProductMutation.mutate(data);
  };

  const handleUpdateProduct = (data: ProductUpdate) => {
    updateProductMutation.mutate(data);
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este produto?")) {
      deleteProductMutation.mutate(id);
    }
  };

  const handleBulkDeleteProducts = () => {
    if (selectedProductIds.size === 0) {
      toast({ title: "Nenhum produto selecionado", description: "Selecione os produtos que deseja excluir.", variant: "warning" });
      return;
    }
    if (window.confirm(`Tem certeza que deseja excluir ${selectedProductIds.size} produtos selecionados? Esta ação não pode ser desfeita.`)) {
      bulkDeleteProductsMutation.mutate(Array.from(selectedProductIds));
    }
  };

  const handleToggleSelectProduct = (productId: string) => {
    setSelectedProductIds(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(productId)) {
        newSelection.delete(productId);
      } else {
        newSelection.add(productId);
      }
      return newSelection;
    });
  };

  const handleSelectAllProducts = () => {
    if (selectedProductIds.size === filteredProducts.length) {
      setSelectedProductIds(new Set()); // Desselecionar todos
    } else {
      const allProductIds = new Set(filteredProducts.map(p => p.id));
      setSelectedProductIds(allProductIds); // Selecionar todos
    }
  };

  const filteredProducts = products?.filter(product =>
    product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.serial_number?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const isAnyProductSelected = selectedProductIds.size > 0;
  const isAllProductsSelected = filteredProducts.length > 0 && selectedProductIds.size === filteredProducts.length;

  if (isLoadingProducts) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  if (productsError) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6">
        <div className="max-w-6xl mx-auto text-center text-destructive">
          <p>Erro ao carregar produtos: {productsError.message}</p>
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
              Gerenciar Produtos
            </h1>
            <p className="text-muted-foreground">
              Adicione, edite e remova os produtos do seu catálogo.
            </p>
          </div>

          <Card className="card-futuristic">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por código, descrição, modelo ou número de série..."
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
                <Package className="h-5 w-5 text-primary" />
                Meus Produtos
              </CardTitle>
              <div className="flex gap-2">
                {isAnyProductSelected && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleBulkDeleteProducts}
                    disabled={bulkDeleteProductsMutation.isPending}
                    className="bg-destructive hover:bg-destructive/80"
                  >
                    {bulkDeleteProductsMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Excluir Selecionados ({selectedProductIds.size})
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSelectAllProducts}
                  disabled={filteredProducts.length === 0}
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  {isAllProductsSelected ? (
                    <Square className="mr-2 h-4 w-4" />
                  ) : (
                    <CheckSquare className="mr-2 h-4 w-4" />
                  )}
                  {isAllProductsSelected ? "Desselecionar Todos" : "Selecionar Todos"}
                </Button>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-gradient-primary hover:bg-gradient-primary/80">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Novo Produto
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] bg-card border-primary/20">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 gradient-text">
                        <Package className="h-5 w-5" />
                        Adicionar Novo Produto
                      </DialogTitle>
                    </DialogHeader>
                    <ProductForm
                      onSave={handleAddProduct}
                      onCancel={() => setIsAddDialogOpen(false)}
                      isPending={addProductMutation.isPending}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredProducts && filteredProducts.length > 0 ? (
                filteredProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 rounded-lg border border-primary/10 bg-slate-darker/10 animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0 mb-3 lg:mb-0">
                      <Checkbox
                        checked={selectedProductIds.has(product.id)}
                        onCheckedChange={() => handleToggleSelectProduct(product.id)}
                        id={`select-product-${product.id}`}
                        className="h-5 w-5"
                      />
                      <div>
                        <h3 className="font-semibold text-lg">{product.code}</h3>
                        <p className="text-sm text-muted-foreground">{product.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mt-1">
                          {product.model && (
                            <div className="flex items-center gap-1">
                              <Box className="h-3 w-3" /> {product.model}
                            </div>
                          )}
                          {product.serial_number && (
                            <div className="flex items-center gap-1">
                              <Hash className="h-3 w-3" /> {product.serial_number}
                            </div>
                          )}
                        </div>
                        {product.image_url && (
                          <div className="mt-2">
                            <img src={product.image_url} alt={product.code} className="w-16 h-16 object-cover rounded-md" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      <Dialog open={isEditDialogOpen && editingProduct?.id === product.id} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-accent text-accent hover:bg-accent/10"
                            onClick={() => {
                              setEditingProduct(product);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="mr-1 h-3 w-3" />
                            Editar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] bg-card border-primary/20">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 gradient-text">
                              <Package className="h-5 w-5" />
                              Editar Produto
                            </DialogTitle>
                          </DialogHeader>
                          {editingProduct && editingProduct.id === product.id && (
                            <ProductForm
                              initialData={editingProduct}
                              onSave={handleUpdateProduct}
                              onCancel={() => {
                                setIsEditDialogOpen(false);
                                setEditingProduct(null);
                              }}
                              isPending={updateProductMutation.isPending}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-destructive text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteProduct(product.id)}
                        disabled={deleteProductMutation.isPending}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4" />
                  <p>Nenhum produto cadastrado. Clique em "Novo Produto" para adicionar.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};