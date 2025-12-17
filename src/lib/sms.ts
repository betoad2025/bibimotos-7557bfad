import { supabase } from "@/integrations/supabase/client";

type SMSType = 'welcome' | 'password_reset' | 'verification' | 'ride_notification' | 'general';

interface SendSMSParams {
  phone: string;
  message: string;
  type: SMSType;
}

// Gera código de 6 dígitos para verificação
export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Envia SMS genérico
export const sendSMS = async ({ phone, message, type }: SendSMSParams) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-sms', {
      body: { phone, message, type }
    });

    if (error) {
      console.error('Erro ao enviar SMS:', error);
      return { success: false, error: error.message };
    }

    return data;
  } catch (error) {
    console.error('Erro ao enviar SMS:', error);
    return { success: false, error: 'Falha ao enviar SMS' };
  }
};

// SMS de boas-vindas após cadastro
export const sendWelcomeSMS = async (phone: string, name: string) => {
  const message = `Olá ${name}! Bem-vindo(a) à Bibi Motos! Seu cadastro foi realizado com sucesso. Baixe nosso app e aproveite!`;
  return sendSMS({ phone, message, type: 'welcome' });
};

// SMS de código de recuperação de senha
export const sendPasswordResetSMS = async (phone: string, code: string) => {
  const message = `Bibi Motos: Seu código de recuperação de senha é ${code}. Válido por 10 minutos. Não compartilhe este código.`;
  return sendSMS({ phone, message, type: 'password_reset' });
};

// SMS de verificação de telefone
export const sendVerificationSMS = async (phone: string, code: string) => {
  const message = `Bibi Motos: Seu código de verificação é ${code}. Válido por 10 minutos.`;
  return sendSMS({ phone, message, type: 'verification' });
};

// SMS de notificação de corrida
export const sendRideNotificationSMS = async (phone: string, driverName: string, vehiclePlate: string) => {
  const message = `Bibi Motos: Seu motorista ${driverName} está a caminho! Veículo: ${vehiclePlate}. Acompanhe pelo app.`;
  return sendSMS({ phone, message, type: 'ride_notification' });
};

// SMS de corrida aceita (para motorista)
export const sendRideAcceptedSMS = async (phone: string, origin: string, destination: string) => {
  const message = `Bibi Motos: Nova corrida! De: ${origin.substring(0, 30)}... Para: ${destination.substring(0, 30)}... Abra o app para detalhes.`;
  return sendSMS({ phone, message, type: 'ride_notification' });
};

// SMS de corrida concluída
export const sendRideCompletedSMS = async (phone: string, value: number) => {
  const message = `Bibi Motos: Corrida finalizada! Valor: R$ ${value.toFixed(2)}. Obrigado por usar nossos serviços!`;
  return sendSMS({ phone, message, type: 'ride_notification' });
};

// SMS de aprovação de motorista
export const sendDriverApprovalSMS = async (phone: string, name: string) => {
  const message = `Parabéns ${name}! Seu cadastro como motorista Bibi Motos foi aprovado! Já pode começar a aceitar corridas.`;
  return sendSMS({ phone, message, type: 'general' });
};

// SMS de motorista rejeitado
export const sendDriverRejectionSMS = async (phone: string, name: string, reason?: string) => {
  const message = reason 
    ? `${name}, seu cadastro Bibi Motos não foi aprovado. Motivo: ${reason}. Entre em contato para mais informações.`
    : `${name}, seu cadastro Bibi Motos precisa de ajustes. Entre em contato conosco para regularizar.`;
  return sendSMS({ phone, message, type: 'general' });
};
