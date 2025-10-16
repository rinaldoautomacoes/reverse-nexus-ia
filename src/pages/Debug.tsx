import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types_generated";

type Profile = Tables<'profiles'>;
type ProfileInsert = TablesInsert<'profiles'>;
type ProfileUpdate = TablesUpdate<'profiles'>;

export const Debug = () => {
  const { user, profile, isLoading } = useAuth();
  const { toast } = useToast();
  const [newRole, setNewRole] = useState<string>('');
  const [newFirstName, setNewFirstName] = useState<string>('');
  const [newLastName, setNewLastName] = useState<string>('');
  const [newPhoneNumber, setNewPhoneNumber] = useState<string>('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setNewRole(profile.role);
      setNewFirstName(profile.first_name || '');
      setNewLastName(profile.last_name || '');
      setNewPhoneNumber(profile.phone_number || '');
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile]);

  const handleUpdateProfile = async () => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
      return;
    }

    let updatedAvatarUrl = avatarUrl;
    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile);

      if (uploadError) {
        toast({ title: "Erro no upload do avatar", description: uploadError.message, variant: "destructive" });
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      updatedAvatarUrl = publicUrlData.publicUrl;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        role: newRole,
        first_name: newFirstName,
        last_name: newLastName,
        phone_number: newPhoneNumber,
        avatar_url: updatedAvatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      toast({ title: "Erro ao atualizar perfil", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso", description: "Perfil atualizado com sucesso!" });
      // Força um refresh do perfil no contexto de autenticação
      window.location.reload();
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
      setAvatarUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  if (isLoading) {
    return <div className="p-4">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-background ai-pattern p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold gradient-text">Debug & Admin Tools</h1>

        <Card className="card-futuristic">
          <CardHeader>
            <CardTitle>Informações do Usuário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>ID:</strong> {user?.id}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Role (do perfil):</strong> {profile?.role}</p>
            <p><strong>Primeiro Nome:</strong> {profile?.first_name}</p>
            <p><strong>Último Nome:</strong> {profile?.last_name}</p>
            <p><strong>Telefone:</strong> {profile?.phone_number}</p>
            <p><strong>Avatar URL:</strong> {profile?.avatar_url}</p>
            {profile?.avatar_url && (
              <img src={profile.avatar_url} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
            )}
          </CardContent>
        </Card>

        <Card className="card-futuristic">
          <CardHeader>
            <CardTitle>Atualizar Perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="firstName">Primeiro Nome</Label>
              <Input
                id="firstName"
                value={newFirstName}
                onChange={(e) => setNewFirstName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Último Nome</Label>
              <Input
                id="lastName"
                value={newLastName}
                onChange={(e) => setNewLastName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="phoneNumber">Telefone</Label>
              <Input
                id="phoneNumber"
                value={newPhoneNumber}
                onChange={(e) => setNewPhoneNumber(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                placeholder="standard ou admin"
              />
            </div>
            <div>
              <Label htmlFor="avatar">Avatar</Label>
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
              />
              {avatarUrl && (
                <img src={avatarUrl} alt="Avatar Preview" className="mt-2 w-24 h-24 rounded-full object-cover" />
              )}
            </div>
            <Button onClick={handleUpdateProfile}>Atualizar Perfil</Button>
          </CardContent>
        </Card>

        <Card className="card-futuristic">
          <CardHeader>
            <CardTitle>Raw User Data (Supabase Auth)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              readOnly
              value={JSON.stringify(user, null, 2)}
              rows={10}
              className="font-mono text-xs"
            />
          </CardContent>
        </Card>

        <Card className="card-futuristic">
          <CardHeader>
            <CardTitle>Raw Profile Data (Supabase Public)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              readOnly
              value={JSON.stringify(profile, null, 2)}
              rows={10}
              className="font-mono text-xs"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};