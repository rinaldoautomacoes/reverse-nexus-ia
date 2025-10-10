import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, UserPlus, Mail, Lock, User, Briefcase, Image as ImageIcon, Upload, Loader2, XCircle, Phone } from "lucide-react"; // Adicionado Phone
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const UserManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, user: currentUser } = useAuth(); // Renomeado user para currentUser para evitar conflito
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "standard",
    avatar_url: "", // Adicionado campo para URL do avatar
    phone_number: "", // NOVO CAMPO: número de telefone
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setImagePreviewUrl(null);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreviewUrl(null);
    handleInputChange("avatar_url", ""); // Limpa a URL do avatar no formulário
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!currentUser?.id) {
      toast({ title: "Erro de autenticação", description: "Usuário não logado.", variant: "destructive" });
      return null;
    }

    setIsUploading(true);
    const fileExtension = file.name.split('.').pop();
    const filePath = `${currentUser.id}/avatars/${Date.now()}.${fileExtension}`; // Usar um bucket 'avatars'

    const { data, error } = await supabase.storage
      .from('avatars') // Nome do bucket para avatares
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
      .from('avatars')
      .getPublicUrl(filePath);
    
    return publicUrlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!session?.access_token) {
      toast({
        title: "Erro de autenticação",
        description: "Sessão de administrador não encontrada. Faça login novamente.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    let finalAvatarUrl = formData.avatar_url;

    if (imageFile) {
      const uploadedUrl = await uploadImage(imageFile);
      if (uploadedUrl) {
        finalAvatarUrl = uploadedUrl;
      } else {
        // Se o upload falhou, impede o envio do formulário
        setIsLoading(false);
        return;
      }
    }

    try {
      // Invoke the Edge Function
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: JSON.stringify({ ...formData, avatar_url: finalAvatarUrl }),
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Usuário criado!",
        description: `O usuário ${formData.email} foi criado com sucesso.`,
      });

      // Reset form
      setFormData({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        role: "standard",
        avatar_url: "",
        phone_number: "", // Resetar também o telefone
      });
      setImageFile(null);
      setImagePreviewUrl(null);

    } catch (error: any) {
      console.error("Erro ao criar usuário:", error);
      toast({
        title: "Erro ao criar usuário",
        description: error.message || "Falha ao criar o usuário. Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background ai-pattern p-6">
      <div className="max-w-4xl mx-auto">
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
              Gerenciar Usuários
            </h1>
            <p className="text-muted-foreground">
              Crie e gerencie contas de usuários na plataforma.
            </p>
          </div>

          <Card className="card-futuristic">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Criar Novo Usuário
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">Primeiro Nome</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="first_name"
                        placeholder="Primeiro Nome"
                        className="pl-10"
                        value={formData.first_name}
                        onChange={(e) => handleInputChange("first_name", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Sobrenome</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="last_name"
                        placeholder="Sobrenome"
                        className="pl-10"
                        value={formData.last_name}
                        onChange={(e) => handleInputChange("last_name", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="novo.usuario@email.com"
                      className="pl-10"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Mínimo de 6 caracteres
                  </p>
                </div>

                {/* NOVO CAMPO: Número de Telefone */}
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Número de Telefone (para notificações)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone_number"
                      type="tel"
                      placeholder="(XX) XXXXX-XXXX"
                      className="pl-10"
                      value={formData.phone_number}
                      onChange={(e) => handleInputChange("phone_number", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatar_url">Foto de Perfil</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="avatar_url"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="flex-1"
                      disabled={isUploading || isLoading}
                    />
                    {imagePreviewUrl && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        onClick={handleRemoveImage}
                        disabled={isUploading || isLoading}
                      >
                        <XCircle className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  {imagePreviewUrl && (
                    <div className="mt-2 relative w-24 h-24 rounded-full border border-border overflow-hidden">
                      <img 
                        src={imagePreviewUrl} 
                        alt="Pré-visualização do avatar" 
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

                <div className="space-y-2">
                  <Label htmlFor="role">Papel (Role)</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                    <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Selecione o papel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Padrão (Standard)</SelectItem>
                        <SelectItem value="admin">Administrador (Admin)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-primary hover:bg-gradient-primary/80 glow-effect"
                    disabled={isLoading || isUploading}
                  >
                    {isLoading || isUploading ? (
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <UserPlus className="mr-2 h-4 w-4" />
                    )}
                    Criar Usuário
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/')}
                    className="flex-1 border-accent text-accent hover:bg-accent/10"
                    disabled={isLoading || isUploading}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};