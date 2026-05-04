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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Users, Search, Shield, Bike, User, Store, Building2, Crown, AlertTriangle, MapPin, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  created_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: string;
}

interface Franchise {
  id: string;
  name: string;
  city_id: string;
  owner_id: string | null;
}

interface UserFranchise {
  user_id: string;
  franchise_name: string;
  city_name: string;
}

export function UsersManagement() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [userFranchises, setUserFranchises] = useState<UserFranchise[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [convertUser, setConvertUser] = useState<Profile | null>(null);
  const [convertFranchiseId, setConvertFranchiseId] = useState("");
  const [addRoleUser, setAddRoleUser] = useState<Profile | null>(null);
  const [newRole, setNewRole] = useState<string>("");
  const [newRoleFranchiseId, setNewRoleFranchiseId] = useState<string>("");
  const [savingRole, setSavingRole] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profilesRes, rolesRes, franchisesRes, driversRes, passengersRes, merchantsRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
        supabase.from("franchises").select("id, name, city_id, owner_id"),
        supabase.from("drivers").select("user_id, franchise_id"),
        supabase.from("passengers").select("user_id, franchise_id"),
        supabase.from("merchants").select("user_id, franchise_id"),
      ]);

      setProfiles(profilesRes.data || []);
      setUserRoles(rolesRes.data || []);
      setFranchises(franchisesRes.data || []);

      // Build user-franchise mapping
      const allFranchises = franchisesRes.data || [];
      const mapping: UserFranchise[] = [];

      const addMapping = (items: any[], entityType: string) => {
        items?.forEach(item => {
          const franchise = allFranchises.find(f => f.id === item.franchise_id);
          if (franchise) {
            mapping.push({
              user_id: item.user_id,
              franchise_name: franchise.name,
              city_name: franchise.name.replace('Bibi Motos ', ''),
            });
          }
        });
      };

      addMapping(driversRes.data || [], 'driver');
      addMapping(passengersRes.data || [], 'passenger');
      addMapping(merchantsRes.data || [], 'merchant');

      // Add franchise owners
      allFranchises.forEach(f => {
        if (f.owner_id) {
          mapping.push({
            user_id: f.owner_id,
            franchise_name: f.name,
            city_name: f.name.replace('Bibi Motos ', ''),
          });
        }
      });

      setUserFranchises(mapping);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
    setLoading(false);
  };

  const getUserRoles = (userId: string) => {
    return userRoles.filter((r) => r.user_id === userId).map((r) => r.role);
  };

  const getUserCities = (userId: string) => {
    const cities = userFranchises
      .filter(uf => uf.user_id === userId)
      .map(uf => uf.city_name);
    return [...new Set(cities)];
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "super_admin": return <Crown className="h-3 w-3" />;
      case "franchise_admin": return <Building2 className="h-3 w-3" />;
      case "driver": return <Bike className="h-3 w-3" />;
      case "passenger": return <User className="h-3 w-3" />;
      case "merchant": return <Store className="h-3 w-3" />;
      default: return <Shield className="h-3 w-3" />;
    }
  };

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
      case "super_admin": return "destructive";
      case "franchise_admin": return "default";
      default: return "secondary";
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
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) throw error;
      toast.success(`Papel ${getRoleLabel(role)} adicionado!`);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao adicionar papel");
    }
  };

  const handleAddRoleWithFranchise = async () => {
    if (!addRoleUser || !newRole) return;
    if (newRole !== "super_admin" && !newRoleFranchiseId) {
      toast.error("Selecione a franquia / cidade");
      return;
    }
    setSavingRole(true);
    try {
      const userId = addRoleUser.user_id;
      const role = newRole as any;
      const franchise = franchises.find((f) => f.id === newRoleFranchiseId);

      // 1. Insere papel (idempotente)
      const existingRoles = getUserRoles(userId);
      if (!existingRoles.includes(role)) {
        const { error: roleErr } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role });
        if (roleErr) throw roleErr;
      }

      // 2. Vincula entidade conforme papel
      if (role === "franchise_admin" && franchise) {
        const { error: ownErr } = await supabase
          .from("franchises")
          .update({ owner_id: userId })
          .eq("id", franchise.id);
        if (ownErr) throw ownErr;
      } else if (role === "driver" && franchise) {
        const { data: existing } = await supabase
          .from("drivers")
          .select("id")
          .eq("user_id", userId)
          .eq("franchise_id", franchise.id)
          .maybeSingle();
        if (!existing) {
          await supabase.from("drivers").insert({
            user_id: userId,
            franchise_id: franchise.id,
            is_approved: false,
          } as any);
        }
      } else if (role === "passenger" && franchise) {
        const { data: existing } = await supabase
          .from("passengers")
          .select("id")
          .eq("user_id", userId)
          .eq("franchise_id", franchise.id)
          .maybeSingle();
        if (!existing) {
          await supabase.from("passengers").insert({
            user_id: userId,
            franchise_id: franchise.id,
          } as any);
        }
      } else if (role === "merchant" && franchise) {
        const { data: existing } = await supabase
          .from("merchants")
          .select("id")
          .eq("user_id", userId)
          .eq("franchise_id", franchise.id)
          .maybeSingle();
        if (!existing) {
          await supabase.from("merchants").insert({
            user_id: userId,
            franchise_id: franchise.id,
            is_approved: false,
            business_name: addRoleUser.full_name || "Meu Negócio",
            business_address: "",
          } as any);
        }
      }

      // 3. Reforça binding de cidade no profile
      if (franchise) {
        const cityName = franchise.name.replace("Bibi Motos ", "");
        await supabase
          .from("profiles")
          .update({ city: cityName })
          .eq("user_id", userId);
      }

      toast.success(`${getRoleLabel(role)} vinculado${franchise ? ` à ${franchise.name}` : ""}!`);
      setAddRoleUser(null);
      setNewRole("");
      setNewRoleFranchiseId("");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao adicionar papel");
    } finally {
      setSavingRole(false);
    }
  };

  const handleRemoveRole = async (userId: string, role: "super_admin" | "franchise_admin" | "driver" | "passenger" | "merchant") => {
    if (!confirm(`Remover papel ${getRoleLabel(role)}?`)) return;
    try {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) throw error;
      toast.success("Papel removido!");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover papel");
    }
  };

  const handleConvertToFranchiseOwner = async () => {
    if (!convertUser || !convertFranchiseId) return;
    try {
      // Assign franchise ownership
      const { error: franchiseError } = await supabase
        .from("franchises")
        .update({ owner_id: convertUser.user_id })
        .eq("id", convertFranchiseId);
      if (franchiseError) throw franchiseError;

      // Add franchise_admin role if not exists
      const roles = getUserRoles(convertUser.user_id);
      if (!roles.includes("franchise_admin")) {
        await supabase.from("user_roles").insert({
          user_id: convertUser.user_id,
          role: "franchise_admin" as any,
        });
      }

      toast.success(`${convertUser.full_name} agora é dono(a) de franquia!`);
      setConvertUser(null);
      setConvertFranchiseId("");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro na conversão");
    }
  };

  const filteredProfiles = profiles.filter((profile) => {
    const matchesSearch =
      profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (profile.phone && profile.phone.includes(searchTerm));

    if (roleFilter === "all") return matchesSearch;
    const roles = getUserRoles(profile.user_id);
    if (roleFilter === "no_role") return matchesSearch && roles.length === 0;
    return matchesSearch && roles.includes(roleFilter);
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Gerenciamento de Usuários ({profiles.length})
            </span>
            <div className="flex flex-wrap items-center gap-2">
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
                <TableHead>Cidade(s)</TableHead>
                <TableHead>Papéis</TableHead>
                <TableHead>Cadastrado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfiles.map((profile) => {
                const roles = getUserRoles(profile.user_id);
                const cities = getUserCities(profile.user_id);
                return (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">{profile.full_name}</TableCell>
                    <TableCell className="text-sm">{profile.email}</TableCell>
                    <TableCell className="text-sm">{profile.phone || "-"}</TableCell>
                    <TableCell>
                      {cities.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {cities.map(city => (
                            <Badge key={city} variant="outline" className="text-xs flex items-center gap-1">
                              <MapPin className="h-2.5 w-2.5" />
                              {city}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
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
                              onClick={() => handleRemoveRole(profile.user_id, role as any)}
                            >
                              {getRoleIcon(role)}
                              {getRoleLabel(role)}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(profile.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setConvertUser(profile); setConvertFranchiseId(""); }}
                          title="Converter em Dono de Franquia"
                          className="text-amber-600 hover:text-amber-700"
                        >
                          <Crown className="h-4 w-4" />
                        </Button>
                        <Select onValueChange={(role) => handleAddRole(profile.user_id, role as any)}>
                          <SelectTrigger className="w-36">
                            <SelectValue placeholder="Add papel" />
                          </SelectTrigger>
                          <SelectContent>
                            {!roles.includes("super_admin") && <SelectItem value="super_admin">Super Admin</SelectItem>}
                            {!roles.includes("franchise_admin") && <SelectItem value="franchise_admin">Admin Franquia</SelectItem>}
                            {!roles.includes("driver") && <SelectItem value="driver">Motorista</SelectItem>}
                            {!roles.includes("passenger") && <SelectItem value="passenger">Passageiro</SelectItem>}
                            {!roles.includes("merchant") && <SelectItem value="merchant">Lojista</SelectItem>}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredProfiles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Convert to Franchise Owner Dialog */}
      <AlertDialog open={!!convertUser} onOpenChange={() => setConvertUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Converter em Dono de Franquia
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  Tornar <strong>{convertUser?.full_name}</strong> ({convertUser?.email}) proprietário(a) de uma franquia.
                </p>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Selecione a franquia:</label>
                  <Select value={convertFranchiseId} onValueChange={setConvertFranchiseId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha a franquia" />
                    </SelectTrigger>
                    <SelectContent>
                      {franchises.map(f => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name} {f.owner_id ? "(já tem dono)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {convertFranchiseId && franchises.find(f => f.id === convertFranchiseId)?.owner_id && (
                  <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg text-sm">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    Esta franquia já possui um proprietário. A conversão irá substituí-lo.
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConvertToFranchiseOwner}
              disabled={!convertFranchiseId}
              className="bg-amber-500 hover:bg-amber-600"
            >
              <Crown className="h-4 w-4 mr-2" />
              Converter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
