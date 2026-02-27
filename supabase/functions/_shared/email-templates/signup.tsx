/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>🏍️ Falta pouco para você começar na Bibi Motos!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={topBar} />
        <Section style={content}>
          <Text style={brandName}>🏍️ Bibi Motos</Text>
          <Heading style={h1}>Confirme seu cadastro</Heading>
          <Text style={subtitle}>
            Estamos muito felizes em ter você com a gente! Confirme seu email para começar a usar a plataforma.
          </Text>
          <Text style={text}>
            O email <Link href={`mailto:${recipient}`} style={link}>{recipient}</Link> foi cadastrado na{' '}
            <Link href={siteUrl} style={link}><strong>Bibi Motos</strong></Link>.
            Clique no botão abaixo para ativar sua conta:
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={confirmationUrl}>
              Ativar minha conta
            </Button>
          </Section>
          <Text style={helpText}>
            Se o botão não funcionar, copie e cole este link no navegador:
          </Text>
          <Text style={urlText}>{confirmationUrl}</Text>
          <Hr style={divider} />
          <Text style={footer}>
            Se você não criou uma conta na Bibi Motos, ignore este email com segurança.
          </Text>
          <Text style={copyright}>
            © {new Date().getFullYear()} Bibi Motos Brasil. Todos os direitos reservados.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }
const container = { maxWidth: '600px', margin: '0 auto' }
const topBar = { backgroundColor: '#7c3aed', height: '6px', borderRadius: '4px 4px 0 0' }
const content = { padding: '40px 32px 32px' }
const brandName = { fontSize: '18px', fontWeight: 'bold' as const, color: '#7c3aed', margin: '0 0 24px', letterSpacing: '-0.3px' }
const h1 = { fontSize: '26px', fontWeight: 'bold' as const, color: '#131316', margin: '0 0 12px', lineHeight: '1.3' }
const subtitle = { fontSize: '16px', color: '#717179', lineHeight: '1.6', margin: '0 0 24px' }
const text = { fontSize: '15px', color: '#131316', lineHeight: '1.6', margin: '0 0 28px' }
const link = { color: '#7c3aed', textDecoration: 'underline' }
const buttonContainer = { textAlign: 'center' as const, margin: '0 0 24px' }
const button = { backgroundColor: '#7c3aed', color: '#ffffff', fontSize: '16px', fontWeight: 'bold' as const, borderRadius: '8px', padding: '14px 32px', textDecoration: 'none', display: 'inline-block' }
const helpText = { fontSize: '13px', color: '#717179', margin: '0 0 6px' }
const urlText = { fontSize: '12px', color: '#7c3aed', wordBreak: 'break-all' as const, margin: '0 0 28px' }
const divider = { borderColor: '#e5e5e5', margin: '24px 0' }
const footer = { fontSize: '13px', color: '#a1a1a6', margin: '0 0 8px' }
const copyright = { fontSize: '12px', color: '#c4c4c8', margin: '0' }
