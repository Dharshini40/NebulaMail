export function composeEmail({ to, subject, body }) {
  if (!to) return { error: 'Recipient (to) is required' };
  return {
    action: 'COMPOSE',
    to,
    subject: subject || '',
    body: body || ''
  };
}