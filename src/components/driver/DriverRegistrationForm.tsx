import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Upload, Camera, CheckCircle2, Bike, FileText,
  CreditCard, Image, AlertCircle, Loader2
} from "lucide-react";

interface DriverRegistrationFormProps {
  userId: string;
  franchiseId: string;
  onComplete: () => void;
}

interface DriverFormData {
  vehicleModel: string;
  vehicleColor: string;
  vehiclePlate: string;
  vehicleYear: string;
  cnhNumber: string;
  cnhCategory: string;
  cnhExpiry: string;
}

interface DriverFiles {
  cnhFront: File | null;
  cnhBack: File | null;
  motorcyclePhoto: File | null;
  motorcyclePlatePhoto: File | null;
  insuranceDocument: File | null;
  crlv: File | null;
}

export function DriverRegistrationForm({ userId, franchiseId, onComplete }: DriverRegistrationFormProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState<DriverFormData>({
    vehicleModel: "",
    vehicleColor: "",
    vehiclePlate: "",
    vehicleYear: "",
    cnhNumber: "",
    cnhCategory: "",
    cnhExpiry: "",
  });

  const [files, setFiles] = useState<DriverFiles>({
    cnhFront: null,
    cnhBack: null,
    motorcyclePhoto: null,
    motorcyclePlatePhoto: null,
    insuranceDocument: null,
    crlv: null,
  });

  const handleFileChange = (key: keyof DriverFiles) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFiles(prev => ({ ...prev, [key]: e.target.files![0] }));
    }
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from("documents")
      .upload(path, file);
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from("documents")
      .getPublicUrl(path);
    
    return publicUrl;
  };

  const validateStep1 = () => {
    if (!formData.vehicleModel || !formData.vehicleColor || !formData.vehiclePlate || !formData.vehicleYear) {
      toast({ title: "Preencha todos os campos do veículo", variant: "destructive" });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.cnhNumber || !formData.cnhCategory || !formData.cnhExpiry) {
      toast({ title: "Preencha todos os dados da CNH", variant: "destructive" });
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!files.cnhFront || !files.cnhBack) {
      toast({ title: "Envie frente e verso da CNH", variant: "destructive" });
      return false;
    }
    if (!files.motorcyclePhoto || !files.motorcyclePlatePhoto) {
      toast({ title: "Envie as fotos da moto", variant: "destructive" });
      return false;
    }
    if (!files.insuranceDocument) {
      toast({ title: "Envie o documento de pagamento", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;

    setIsLoading(true);
    try {
      // Upload all files
      const timestamp = Date.now();
      const urls: Record<string, string> = {};

      if (files.cnhFront) {
        urls.cnhFront = await uploadFile(files.cnhFront, `${userId}/cnh-front-${timestamp}`);
      }
      if (files.cnhBack) {
        urls.cnhBack = await uploadFile(files.cnhBack, `${userId}/cnh-back-${timestamp}`);
      }
      if (files.motorcyclePhoto) {
        urls.motorcyclePhoto = await uploadFile(files.motorcyclePhoto, `${userId}/moto-${timestamp}`);
      }
      if (files.motorcyclePlatePhoto) {
        urls.motorcyclePlatePhoto = await uploadFile(files.motorcyclePlatePhoto, `${userId}/moto-plate-${timestamp}`);
      }
      if (files.insuranceDocument) {
        urls.insuranceDocument = await uploadFile(files.insuranceDocument, `${userId}/insurance-${timestamp}`);
      }
      if (files.crlv) {
        urls.crlv = await uploadFile(files.crlv, `${userId}/crlv-${timestamp}`);
      }

      // Create driver record
      const { data: driver, error: driverError } = await supabase
        .from("drivers")
        .insert({
          user_id: userId,
          franchise_id: franchiseId,
          vehicle_model: formData.vehicleModel,
          vehicle_color: formData.vehicleColor,
          vehicle_plate: formData.vehiclePlate.toUpperCase(),
          vehicle_year: parseInt(formData.vehicleYear),
          cnh_number: formData.cnhNumber,
          cnh_category: formData.cnhCategory.toUpperCase(),
          cnh_expiry: formData.cnhExpiry,
          cnh_front_url: urls.cnhFront,
          cnh_back_url: urls.cnhBack,
          motorcycle_photo_url: urls.motorcyclePhoto,
          motorcycle_plate_photo_url: urls.motorcyclePlatePhoto,
          insurance_document_url: urls.insuranceDocument,
          crlv_url: urls.crlv || null,
          registration_complete: true,
          is_approved: false,
        })
        .select()
        .single();

      if (driverError) throw driverError;

      // Add driver role
      await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          role: "driver",
        });

      // Notify franchise admin
      try {
        await supabase.functions.invoke("notify-driver-registration", {
          body: {
            driver_id: driver.id,
            franchise_id: franchiseId,
          },
        });
      } catch (notifyError) {
        console.error("Error notifying admin:", notifyError);
      }

      toast({
        title: "Cadastro enviado!",
        description: "Seus documentos serão analisados e você receberá uma notificação.",
      });

      onComplete();
    } catch (error: any) {
      console.error("Error submitting driver registration:", error);
      toast({
        title: "Erro ao enviar",
        description: error.message,
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const FileUploadBox = ({ 
    label, 
    file, 
    onChange, 
    icon: Icon,
    accept = "image/*",
    capture,
  }: { 
    label: string;
    file: File | null;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    icon: any;
    accept?: string;
    capture?: "user" | "environment";
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div 
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
          file ? 'border-green-500 bg-green-50' : 'border-muted hover:border-primary'
        }`}
      >
        <input
          type="file"
          accept={accept}
          capture={capture}
          onChange={onChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
        {file ? (
          <div className="text-green-600">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2" />
            <span className="text-sm font-medium">{file.name}</span>
          </div>
        ) : (
          <div className="text-muted-foreground">
            <Icon className="h-8 w-8 mx-auto mb-2" />
            <span className="text-sm">Toque para enviar</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between px-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${
              step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {s}
            </div>
            {s < 3 && (
              <div className={`h-1 w-16 mx-2 ${step > s ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Vehicle Info */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bike className="h-5 w-5 text-primary" />
              Dados do Veículo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Modelo da Moto *</Label>
                <Input
                  placeholder="Ex: Honda CG 160"
                  value={formData.vehicleModel}
                  onChange={(e) => setFormData(prev => ({ ...prev, vehicleModel: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Cor *</Label>
                <Input
                  placeholder="Ex: Preta"
                  value={formData.vehicleColor}
                  onChange={(e) => setFormData(prev => ({ ...prev, vehicleColor: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Placa *</Label>
                <Input
                  placeholder="ABC-1234"
                  value={formData.vehiclePlate}
                  onChange={(e) => setFormData(prev => ({ ...prev, vehiclePlate: e.target.value.toUpperCase() }))}
                  maxLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label>Ano *</Label>
                <Input
                  type="number"
                  placeholder="2020"
                  value={formData.vehicleYear}
                  onChange={(e) => setFormData(prev => ({ ...prev, vehicleYear: e.target.value }))}
                  min={1990}
                  max={new Date().getFullYear() + 1}
                />
              </div>
            </div>

            <Button 
              className="w-full" 
              onClick={() => validateStep1() && setStep(2)}
            >
              Continuar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: CNH Info */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Dados da CNH
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Número da CNH *</Label>
              <Input
                placeholder="00000000000"
                value={formData.cnhNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, cnhNumber: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Input
                  placeholder="A, AB, etc"
                  value={formData.cnhCategory}
                  onChange={(e) => setFormData(prev => ({ ...prev, cnhCategory: e.target.value.toUpperCase() }))}
                  maxLength={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Validade *</Label>
                <Input
                  type="date"
                  value={formData.cnhExpiry}
                  onChange={(e) => setFormData(prev => ({ ...prev, cnhExpiry: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button 
                className="flex-1" 
                onClick={() => validateStep2() && setStep(3)}
              >
                Continuar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Documents */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Documentos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-semibold">Todos os documentos são obrigatórios</p>
                  <p>Envie fotos nítidas e legíveis para agilizar sua aprovação.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FileUploadBox
                label="CNH (Frente) *"
                file={files.cnhFront}
                onChange={handleFileChange("cnhFront")}
                icon={CreditCard}
                capture="environment"
              />
              <FileUploadBox
                label="CNH (Verso) *"
                file={files.cnhBack}
                onChange={handleFileChange("cnhBack")}
                icon={CreditCard}
                capture="environment"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FileUploadBox
                label="Foto da Moto *"
                file={files.motorcyclePhoto}
                onChange={handleFileChange("motorcyclePhoto")}
                icon={Bike}
                capture="environment"
              />
              <FileUploadBox
                label="Foto da Placa *"
                file={files.motorcyclePlatePhoto}
                onChange={handleFileChange("motorcyclePlatePhoto")}
                icon={Image}
                capture="environment"
              />
            </div>

            <FileUploadBox
              label="Documento Pago (IPVA/Licenciamento) *"
              file={files.insuranceDocument}
              onChange={handleFileChange("insuranceDocument")}
              icon={FileText}
              accept="image/*,.pdf"
            />

            <FileUploadBox
              label="CRLV (Opcional)"
              file={files.crlv}
              onChange={handleFileChange("crlv")}
              icon={FileText}
              accept="image/*,.pdf"
            />

            <div className="flex gap-4 pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>
                Voltar
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Enviar Cadastro
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
