
-- Corrigir última política permissiva em support_messages
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON public.support_messages;
CREATE POLICY "Users can insert messages in own conversations"
  ON public.support_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.support_conversations 
      WHERE user_id = auth.uid()
    )
    OR sender_id = auth.uid()
  );

-- Remover política duplicada de franchise_leads
DROP POLICY IF EXISTS "Rate limited lead insertion" ON public.franchise_leads;
