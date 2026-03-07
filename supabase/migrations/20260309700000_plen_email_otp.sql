-- Códigos OTP enviados pelo app (SMTP) para verificação de email Plen/WhatsApp.
-- Usado quando SMTP está configurado no app; evita depender do envio do Supabase.
create table if not exists plen_email_otp (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

create unique index if not exists plen_email_otp_email_key on plen_email_otp (email);
create index if not exists plen_email_otp_email_code on plen_email_otp (email, code);

comment on table plen_email_otp is 'OTP de 6 dígitos enviado pelo app (SMTP) para cadastro Plen via WhatsApp';
