import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Package, Tag, FileText, Box, Hash, Image as ImageIcon, Upload, Loader2, XCircle } from "lucide-react";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

type ProductInsert = TablesInsert<'products'>;
type ProductUpdate = TablesUpdate<'products'>;

interface ProductFormProps {
  initialData?: ProductUpdate;
  onSave: (data: ProductInsert | ProductUpdate) => void;
  onCancel: () => void;
  isPending: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({ initialData, onSave, onCancel, isPending }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState<ProductInsert | ProductUpdate>(initialData || {
    code: "",
    description: "",
    model: "",
    serial_number: "",
    image_url: "",
    user_id: "", // Será preenchido pela mutação
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (initialData?.image_url) {
      setImagePreviewUrl(initialData.image_url);
    } else {
      setImagePreviewUrl(null);
    }
    setFormData(initialData || {
      code: "",
      description: "",
      model: "",
      serial_number: "",
      image_url: "",
      user_id: "",
    });
    setImageFile(null); // Reset file input on initialData change
  }, [initialData]);

  const handleInputChange = (field: keyof (ProductInsert | ProductUpdate), value: string | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      if (!formData.image_url) { // Only clear preview if no existing URL
        setImagePreviewUrl(null);
      }
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreviewUrl(null);
    handleInputChange("image_url", null);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!user?.id) {
      toast({ title: "Erro de autenticação", description: "Usuário não logado.", variant: "destructive" });
      return null;
    }

    setIsUploading(true);
    const fileExtension = file.name.split('.').pop();
    const filePath = `${user.id}/products/${Date.now()}.${fileExtension}`;

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    setIsUploading(false);

    if (error) {
      toast({ title: "Erro no upload da imagem", description: error.message, variant: "destructive" });
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);
    
    return publicUrlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast({ title: "Erro de autenticação", description: "Você precisa estar logado para salvar produtos.", variant: "destructive" });
      return;
    }

    let finalImageUrl = formData.image_url;

    if (imageFile) {
      const uploadedUrl = await uploadImage(imageFile);
      if (uploadedUrl) {
        finalImageUrl = uploadedUrl;
      } else {
        // If upload failed, prevent saving the form
        return;
      }
    }

    onSave({ ...formData, image_url: finalImageUrl, user_id: user.id });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="code">Código do Produto *</Label>
        <div className="relative">
          <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="code"
            placeholder="Ex: PROD-001"
            className="pl-10"
            value={formData.code || ''}
            onChange={(e) => handleInputChange("code", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição do Produto</Label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Textarea
            id="description"
            placeholder="Descrição detalhada do produto..."
            className="pl-10 min-h-[80px]"
            value={formData.description || ''}
            onChange={(e) => handleInputChange("description", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="model">Modelo</Label>
          <div className="relative">
            <Box className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="model"
              placeholder="Ex: XYZ-2000"
              className="pl-10"
              value={formData.model || ''}
              onChange={(e) => handleInputChange("model", e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="serial_number">Número de Série</Label>
          <div className="relative">
            <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="serial_number"
              placeholder="Ex: SN123456789"
              className="pl-10"
              value={formData.serial_number || ''}
              onChange={(e) => handleInputChange("serial_number", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="image_upload">Foto do Produto</Label>
        <div className="flex items-center gap-2">
          <Input
            id="image_upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="flex-1"
            disabled={isUploading || isPending}
          />
          {imagePreviewUrl && (
            <Button 
              type="button" 
              variant="outline" 
              size="icon" 
              onClick={handleRemoveImage}
              disabled={isUploading || isPending}
            >
              <XCircle className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
        {imagePreviewUrl && (
          <div className="mt-2 relative w-32 h-32 rounded-md border border-border overflow-hidden">
            <img 
              src={imagePreviewUrl} 
              alt="Pré-visualização do produto" 
              className="w-full h-full object-cover" 
            />
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending || isUploading}>
          Cancelar
        </Button>
        <Button
          type="submit"
          className="bg-gradient-primary hover:bg-gradient-primary/80 glow-effect"
          disabled={isPending || isUploading}
        >
          {isPending || isUploading ? (
            <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <Package className="mr-2 h-4 w-4" />
          )}
          {initialData ? "Salvar Alterações" : "Adicionar Produto"}
        </Button>
      </div>
    </form>
  );
};