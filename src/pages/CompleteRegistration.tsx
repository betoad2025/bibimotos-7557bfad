import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Camera, FileText, User, Building2, CheckCircle2, ImagePlus } from "lucide-react";
import logoImage from "@/assets/logo-simbolo.png";
import { sendWelcomeSMS } from "@/lib/sms";

type PersonType = 'pf' | 'pj';
type Step = 'type' | 'photo' | 'personal' | 'documents' | 'selfie' | 'review';

export default function CompleteRegistration() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<Step>('type');
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    personType: 'pf' as PersonType,
    cpf: '',
    cnpj: '',
    rg: '',
    stateRegistration: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Input mask helpers
  const maskCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const maskCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .slice(0, 14)
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  };

  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .slice(0, 11)
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
  };

  const maskCEP = (value: string) => {
    return value
      .replace(/\D/g, '')
      .slice(0, 8)
      .replace(/(\d{5})(\d{1,3})$/, '$1-$2');
  };

  const validateCPF = (cpf: string): boolean => {
    const digits = cpf.replace(/\D/g, '');
    if (digits.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(digits)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
    let check = 11 - (sum % 11);
    if (check >= 10) check = 0;
    if (parseInt(digits[9]) !== check) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
    check = 11 - (sum % 11);
    if (check >= 10) check = 0;
    return parseInt(digits[10]) === check;
  };

  const validateCNPJ = (cnpj: string): boolean => {
    const digits = cnpj.replace(/\D/g, '');
    if (digits.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(digits)) return false;
    return true; // Simplified validation
  };

  const validatePersonalStep = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (formData.personType === 'pf') {
      if (!formData.cpf || !validateCPF(formData.cpf)) {
        errors.cpf = 'CPF inválido';
      }
      if (!formData.rg || formData.rg.replace(/\D/g, '').length < 5) {
        errors.rg = 'RG obrigatório';
      }
    } else {
      if (!formData.cnpj || !validateCNPJ(formData.cnpj)) {
        errors.cnpj = 'CNPJ inválido';
      }
    }

    if (!formData.phone || formData.phone.replace(/\D/g, '').length < 10) {
      errors.phone = 'Telefone inválido';
    }
    if (!formData.address) errors.address = 'Endereço obrigatório';
    if (!formData.city) errors.city = 'Cidade obrigatória';
    if (!formData.state || formData.state.length !== 2) errors.state = 'UF inválido';
    if (!formData.zipCode || formData.zipCode.replace(/\D/g, '').length !== 8) errors.zipCode = 'CEP inválido';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const [files, setFiles] = useState({
    profilePhoto: null as File | null,
    documentFront: null as File | null,
    documentBack: null as File | null,
    selfie: null as File | null,
    selfieWithDoc: null as File | null,
  });
  
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setFiles(prev => ({ ...prev, profilePhoto: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (key: keyof typeof files) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFiles(prev => ({ ...prev, [key]: e.target.files![0] }));
    }
  };

  const uploadFile = async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(path, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path);
    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    if (!files.profilePhoto) {
      toast({ title: "Foto obrigatória", description: "Por favor, envie sua foto de perfil.", variant: "destructive" });
      setStep('photo');
      return;
    }
    
    setIsLoading(true);
    
    try {
      let avatarUrl = '';
      let documentFrontUrl = '';
      let documentBackUrl = '';
      let selfieUrl = '';
      let selfieWithDocUrl = '';
      
      // Upload profile photo (required)
      avatarUrl = await uploadFile(files.profilePhoto, `${user.id}/avatar-${Date.now()}`);
      
      // Upload other files
      if (files.documentFront) {
        documentFrontUrl = await uploadFile(files.documentFront, `${user.id}/doc-front-${Date.now()}`);
      }
      if (files.documentBack) {
        documentBackUrl = await uploadFile(files.documentBack, `${user.id}/doc-back-${Date.now()}`);
      }
      if (files.selfie) {
        selfieUrl = await uploadFile(files.selfie, `${user.id}/selfie-${Date.now()}`);
      }
      if (files.selfieWithDoc) {
        selfieWithDocUrl = await uploadFile(files.selfieWithDoc, `${user.id}/selfie-doc-${Date.now()}`);
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_url: avatarUrl,
          person_type: formData.personType,
          cpf: formData.cpf || null,
          cnpj: formData.cnpj || null,
          rg: formData.rg || null,
          state_registration: formData.stateRegistration || null,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zipCode,
          document_front_url: documentFrontUrl || null,
          document_back_url: documentBackUrl || null,
          selfie_url: selfieUrl || null,
          selfie_with_doc_url: selfieWithDocUrl || null,
          kyc_status: 'pending',
          profile_complete: true,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Enviar SMS de boas-vindas
      if (formData.phone) {
        const userName = profile?.full_name || 'Cliente';
        sendWelcomeSMS(formData.phone, userName).catch(console.error);
      }

      toast({ title: "Cadastro enviado!", description: "Seus documentos estão em análise." });
      navigate('/dashboard');
    } catch (error: any) {
      toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
    }
    setIsLoading(false);
  };

  const steps = [
    { id: 'type', label: 'Tipo', icon: User },
    { id: 'photo', label: 'Foto', icon: ImagePlus },
    { id: 'personal', label: 'Dados', icon: FileText },
    { id: 'documents', label: 'Documentos', icon: Upload },
    { id: 'selfie', label: 'Selfie', icon: Camera },
    { id: 'review', label: 'Revisão', icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <img src={logoImage} alt="Bibi Motos" className="h-16 w-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-purple-700">Complete seu Cadastro</h1>
          <p className="text-muted-foreground">Precisamos de alguns dados para verificar sua identidade</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8 px-4">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className={`flex flex-col items-center ${step === s.id ? 'text-purple-600' : 'text-muted-foreground'}`}>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  step === s.id ? 'bg-purple-600 text-white' : 
                  steps.findIndex(st => st.id === step) > i ? 'bg-green-500 text-white' : 'bg-muted'
                }`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <span className="text-xs mt-1 hidden sm:block">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 w-8 sm:w-16 mx-2 ${
                  steps.findIndex(st => st.id === step) > i ? 'bg-green-500' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        <Card className="border-2">
          <CardContent className="p-6">
            {/* Step 1: Person Type */}
            {step === 'type' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold">Tipo de Pessoa</h2>
                <RadioGroup
                  value={formData.personType}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, personType: v as PersonType }))}
                  className="grid grid-cols-2 gap-4"
                >
                  <Label
                    htmlFor="pf"
                    className={`flex flex-col items-center gap-2 p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.personType === 'pf' ? 'border-purple-500 bg-purple-50' : 'hover:border-purple-300'
                    }`}
                  >
                    <RadioGroupItem value="pf" id="pf" className="sr-only" />
                    <User className="h-10 w-10 text-purple-600" />
                    <span className="font-bold">Pessoa Física</span>
                    <span className="text-xs text-muted-foreground text-center">CPF e RG</span>
                  </Label>
                  <Label
                    htmlFor="pj"
                    className={`flex flex-col items-center gap-2 p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.personType === 'pj' ? 'border-purple-500 bg-purple-50' : 'hover:border-purple-300'
                    }`}
                  >
                    <RadioGroupItem value="pj" id="pj" className="sr-only" />
                    <Building2 className="h-10 w-10 text-purple-600" />
                    <span className="font-bold">Pessoa Jurídica</span>
                    <span className="text-xs text-muted-foreground text-center">CNPJ e Inscrição Estadual</span>
                  </Label>
                </RadioGroup>
                <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => setStep('photo')}>
                  Continuar
                </Button>
              </div>
            )}

            {/* Step 2: Profile Photo */}
            {step === 'photo' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold">Sua Foto de Perfil</h2>
                <p className="text-muted-foreground">
                  Esta foto será exibida no seu perfil e durante as corridas. É obrigatória para garantir a segurança de todos.
                </p>

                <div className="flex flex-col items-center gap-4">
                  <div 
                    className={`w-40 h-40 rounded-full border-4 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden ${
                      profilePhotoPreview ? 'border-green-500' : 'border-purple-300 hover:border-purple-500'
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={handleProfilePhotoChange}
                      className="absolute w-40 h-40 opacity-0 cursor-pointer"
                    />
                    {profilePhotoPreview ? (
                      <img 
                        src={profilePhotoPreview} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <Camera className="h-12 w-12 mx-auto mb-2 text-purple-400" />
                        <span className="text-sm text-muted-foreground">Toque para tirar foto</span>
                      </div>
                    )}
                  </div>
                  
                  {profilePhotoPreview && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-sm font-medium">Foto adicionada!</span>
                    </div>
                  )}
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">📸 Dicas para uma boa foto:</h4>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    <li>• Rosto bem visível e iluminado</li>
                    <li>• Sem óculos escuros ou bonés</li>
                    <li>• Fundo neutro de preferência</li>
                    <li>• Expressão natural</li>
                  </ul>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep('type')}>Voltar</Button>
                  <Button 
                    className="flex-1 bg-purple-600 hover:bg-purple-700" 
                    onClick={() => setStep('personal')}
                    disabled={!files.profilePhoto}
                  >
                    Continuar
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Personal Data */}
            {step === 'personal' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Dados Pessoais</h2>
                
                {formData.personType === 'pf' ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>CPF *</Label>
                        <Input
                          placeholder="000.000.000-00"
                          value={formData.cpf}
                          onChange={(e) => setFormData(prev => ({ ...prev, cpf: maskCPF(e.target.value) }))}
                          className={validationErrors.cpf ? 'border-destructive' : ''}
                        />
                        {validationErrors.cpf && <p className="text-xs text-destructive">{validationErrors.cpf}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>RG *</Label>
                        <Input
                          placeholder="00.000.000-0"
                          value={formData.rg}
                          onChange={(e) => setFormData(prev => ({ ...prev, rg: e.target.value }))}
                          className={validationErrors.rg ? 'border-destructive' : ''}
                        />
                        {validationErrors.rg && <p className="text-xs text-destructive">{validationErrors.rg}</p>}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>CNPJ *</Label>
                        <Input
                          placeholder="00.000.000/0000-00"
                          value={formData.cnpj}
                          onChange={(e) => setFormData(prev => ({ ...prev, cnpj: maskCNPJ(e.target.value) }))}
                          className={validationErrors.cnpj ? 'border-destructive' : ''}
                        />
                        {validationErrors.cnpj && <p className="text-xs text-destructive">{validationErrors.cnpj}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>Inscrição Estadual</Label>
                        <Input
                          placeholder="Opcional"
                          value={formData.stateRegistration}
                          onChange={(e) => setFormData(prev => ({ ...prev, stateRegistration: e.target.value }))}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label>Telefone/WhatsApp *</Label>
                  <Input
                    placeholder="(00) 00000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: maskPhone(e.target.value) }))}
                    className={validationErrors.phone ? 'border-destructive' : ''}
                  />
                  {validationErrors.phone && <p className="text-xs text-destructive">{validationErrors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Endereço Completo *</Label>
                  <Input
                    placeholder="Rua, número, complemento"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className={validationErrors.address ? 'border-destructive' : ''}
                  />
                  {validationErrors.address && <p className="text-xs text-destructive">{validationErrors.address}</p>}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Cidade *</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      className={validationErrors.city ? 'border-destructive' : ''}
                    />
                    {validationErrors.city && <p className="text-xs text-destructive">{validationErrors.city}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Estado *</Label>
                    <Input
                      placeholder="UF"
                      maxLength={2}
                      value={formData.state}
                      onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                      className={validationErrors.state ? 'border-destructive' : ''}
                    />
                    {validationErrors.state && <p className="text-xs text-destructive">{validationErrors.state}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>CEP *</Label>
                    <Input
                      placeholder="00000-000"
                      value={formData.zipCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, zipCode: maskCEP(e.target.value) }))}
                      className={validationErrors.zipCode ? 'border-destructive' : ''}
                    />
                    {validationErrors.zipCode && <p className="text-xs text-destructive">{validationErrors.zipCode}</p>}
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep('photo')}>Voltar</Button>
                  <Button className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={() => {
                    if (validatePersonalStep()) {
                      setStep('documents');
                    }
                  }}>
                    Continuar
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Documents */}
            {step === 'documents' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold">Documentos</h2>
                <p className="text-muted-foreground">
                  Envie fotos do seu documento (CNH ou RG) frente e verso
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Documento (Frente) *</Label>
                    <div className="border-2 border-dashed rounded-xl p-6 text-center hover:border-purple-400 transition-colors cursor-pointer relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange('documentFront')}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      {files.documentFront ? (
                        <div className="text-green-600">
                          <CheckCircle2 className="h-8 w-8 mx-auto mb-2" />
                          <span className="text-sm">{files.documentFront.name}</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Clique para enviar</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Documento (Verso) *</Label>
                    <div className="border-2 border-dashed rounded-xl p-6 text-center hover:border-purple-400 transition-colors cursor-pointer relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange('documentBack')}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      {files.documentBack ? (
                        <div className="text-green-600">
                          <CheckCircle2 className="h-8 w-8 mx-auto mb-2" />
                          <span className="text-sm">{files.documentBack.name}</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Clique para enviar</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep('personal')}>Voltar</Button>
                  <Button 
                    className="flex-1 bg-purple-600 hover:bg-purple-700" 
                    onClick={() => setStep('selfie')}
                    disabled={!files.documentFront || !files.documentBack}
                  >
                    Continuar
                  </Button>
                </div>
              </div>
            )}

            {/* Step 5: Selfie */}
            {step === 'selfie' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold">Verificação de Identidade</h2>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Selfie (Sozinho) *</Label>
                    <div className="border-2 border-dashed rounded-xl p-6 text-center hover:border-purple-400 transition-colors cursor-pointer relative">
                      <input
                        type="file"
                        accept="image/*"
                        capture="user"
                        onChange={handleFileChange('selfie')}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      {files.selfie ? (
                        <div className="text-green-600">
                          <CheckCircle2 className="h-8 w-8 mx-auto mb-2" />
                          <span className="text-sm">{files.selfie.name}</span>
                        </div>
                      ) : (
                        <>
                          <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Tire uma selfie</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Selfie com Documento *</Label>
                    <div className="border-2 border-dashed rounded-xl p-6 text-center hover:border-purple-400 transition-colors cursor-pointer relative">
                      <input
                        type="file"
                        accept="image/*"
                        capture="user"
                        onChange={handleFileChange('selfieWithDoc')}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      {files.selfieWithDoc ? (
                        <div className="text-green-600">
                          <CheckCircle2 className="h-8 w-8 mx-auto mb-2" />
                          <span className="text-sm">{files.selfieWithDoc.name}</span>
                        </div>
                      ) : (
                        <>
                          <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Segure o documento</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep('documents')}>Voltar</Button>
                  <Button 
                    className="flex-1 bg-purple-600 hover:bg-purple-700" 
                    onClick={() => setStep('review')}
                    disabled={!files.selfie || !files.selfieWithDoc}
                  >
                    Continuar
                  </Button>
                </div>
              </div>
            )}

            {/* Step 6: Review */}
            {step === 'review' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold">Revisão dos Dados</h2>
                
                <div className="space-y-4 bg-muted/50 rounded-xl p-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo:</span>
                    <span className="font-medium">{formData.personType === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}</span>
                  </div>
                  {formData.personType === 'pf' ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">CPF:</span>
                        <span className="font-medium">{formData.cpf}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">RG:</span>
                        <span className="font-medium">{formData.rg}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">CNPJ:</span>
                        <span className="font-medium">{formData.cnpj}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Telefone:</span>
                    <span className="font-medium">{formData.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cidade:</span>
                    <span className="font-medium">{formData.city}/{formData.state}</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {files.documentFront && (
                    <div className="aspect-square bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                  )}
                  {files.documentBack && (
                    <div className="aspect-square bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                  )}
                  {files.selfie && (
                    <div className="aspect-square bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                  )}
                  {files.selfieWithDoc && (
                    <div className="aspect-square bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep('selfie')}>Voltar</Button>
                  <Button 
                    className="flex-1 bg-purple-600 hover:bg-purple-700" 
                    onClick={handleSubmit}
                    disabled={isLoading}
                  >
                    {isLoading ? "Enviando..." : "Enviar para Análise"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
