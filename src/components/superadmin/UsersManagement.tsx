import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Search, Shield, Bike, User, Store, Building2, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: string;
}

export function UsersManagement() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
      ]);

      setProfiles(profilesRes.data || []);
      setUserRoles(rolesRes.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
    setLoading(false);
  };

  const getUserRoles = (userId: string) => {
    return userRoles.filter((r) => r.user_id === userId).map((r) => r.role);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Crown className="h-3 w-3" />;
      case "franchise_admin":
        return <Building2 className="h-3 w-3" />;
      case "driver":
        return <Bike className="h-3 w-3" />;
      case "passenger":
        return <User className="h-3 w-3" />;
      case "merchant":
        return <Store className="h-3 w-3" />;
      default:
        return <Shield className="h-3 w-3" />;
    }
  };

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
      case "super_admin":
        return "destructive";
      case "franchise_admin":
        return "default";
      default:
        return "secondary";
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      super_admin: "Super Admin",
      franchise_admin: "Admin Franquia",
      driver: "Motorista",
      passenger: "Passageiro",
      merchant: "Lojista",
    };
    return labels[role] || role;
  };

  const handleAddRole = async (userId: string, role: "super_admin" | "franchise_admin" | "driver" | "passenger" | "merchant") => {
    try {
      const { error } = await supabase.from("user_roles").insert({
        user_id: userId,
        role,
      });
      if (error) throw error;
      toast.success(`Papel ${getRoleLabel(role)} adicionado!`);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao adicionar papel");
    }
  };

  const handleRemoveRole = async (userId: string, role: "super_admin" | "franchise_admin" | "driver" | "passenger" | "merchant") => {
    if (!confirm(`Remover papel ${getRoleLabel(role)}?`)) return;

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);
      if (error) throw error;
      toast.success("Papel removido!");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover papel");
    }
  };

  const filteredProfiles = profiles.filter((profile) => {
    const matchesSearch =
      profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (roleFilter === "all") return matchesSearch;

    const roles = getUserRoles(profile.user_id);
    if (roleFilter === "no_role") return matchesSearch && roles.length === 0;
    return matchesSearch && roles.includes(roleFilter);
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-purple-600 border-t-transparent rounded-full mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Gerenciamento de Usuários ({profiles.length})
          </span>
          <div className="flex items-center gap-2">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Filtrar por papel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="franchise_admin">Admin Franquia</SelectItem>
                <SelectItem value="driver">Motoristas</SelectItem>
                <SelectItem value="passenger">Passageiros</SelectItem>
                <SelectItem value="merchant">Lojistas</SelectItem>
                <SelectItem value="no_role">Sem papel</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Papéis</TableHead>
              <TableHead>Cadastrado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProfiles.map((profile) => {
              const roles = getUserRoles(profile.user_id);
              return (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium">{profile.full_name}</TableCell>
                  <TableCell>{profile.email}</TableCell>
                  <TableCell>{profile.phone || "-"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {roles.length === 0 ? (
                        <Badge variant="outline">Sem papel</Badge>
                      ) : (
                        roles.map((role) => (
                          <Badge
                            key={role}
                            variant={getRoleBadgeVariant(role)}
                            className="flex items-center gap-1 cursor-pointer hover:opacity-80"
                            onClick={() => handleRemoveRole(profile.user_id, role as "super_admin" | "franchise_admin" | "driver" | "passenger" | "merchant")}
                          >
                            {getRoleIcon(role)}
                            {getRoleLabel(role)}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(profile.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Select onValueChange={(role) => handleAddRole(profile.user_id, role as "super_admin" | "franchise_admin" | "driver" | "passenger" | "merchant")}>
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="Add papel" />
                      </SelectTrigger>
                      <SelectContent>
                        {!roles.includes("super_admin") && (
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        )}
                        {!roles.includes("franchise_admin") && (
                          <SelectItem value="franchise_admin">Admin Franquia</SelectItem>
                        )}
                        {!roles.includes("driver") && (
                          <SelectItem value="driver">Motorista</SelectItem>
                        )}
                        {!roles.includes("passenger") && (
                          <SelectItem value="passenger">Passageiro</SelectItem>
                        )}
                        {!roles.includes("merchant") && (
                          <SelectItem value="merchant">Lojista</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredProfiles.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
