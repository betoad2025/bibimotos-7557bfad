/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>🔒 Seu código de verificação — Bibi Motos</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={topBar} />
        <Section style={content}>
          <Text style={brandName}>🏍️ Bibi Motos</Text>
          <Heading style={h1}>Código de verificação</Heading>
          <Text style={subtitle}>
            Use o código abaixo para confirmar sua identidade:
          </Text>
          <Section style={codeContainer}>
            <Text style={codeStyle}>{token}</Text>
          </Section>
          <Text style={helpText}>
            Este código expira em poucos minutos. Não compartilhe com ninguém.
          </Text>
          <Hr style={divider} />
          <Text style={footer}>
            Se você não solicitou este código, ignore este email com segurança.
          </Text>
          <Text style={copyright}>
            © {new Date().getFullYear()} Bibi Motos Brasil. Todos os direitos reservados.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }
const container = { maxWidth: '600px', margin: '0 auto' }
const topBar = { backgroundColor: '#7c3aed', height: '6px', borderRadius: '4px 4px 0 0' }
const content = { padding: '40px 32px 32px' }
const brandName = { fontSize: '18px', fontWeight: 'bold' as const, color: '#7c3aed', margin: '0 0 24px', letterSpacing: '-0.3px' }
const h1 = { fontSize: '26px', fontWeight: 'bold' as const, color: '#131316', margin: '0 0 12px', lineHeight: '1.3' }
const subtitle = { fontSize: '16px', color: '#717179', lineHeight: '1.6', margin: '0 0 24px' }
const codeContainer = { textAlign: 'center' as const, margin: '0 0 24px', backgroundColor: '#f5f3ff', borderRadius: '8px', padding: '20px' }
const codeStyle = { fontFamily: '"Roboto Mono", Courier, monospace', fontSize: '32px', fontWeight: 'bold' as const, color: '#7c3aed', margin: '0', letterSpacing: '6px' }
const helpText = { fontSize: '13px', color: '#717179', margin: '0 0 6px', textAlign: 'center' as const }
const divider = { borderColor: '#e5e5e5', margin: '24px 0' }
const footer = { fontSize: '13px', color: '#a1a1a6', margin: '0 0 8px' }
const copyright = { fontSize: '12px', color: '#c4c4c8', margin: '0' }
