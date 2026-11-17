import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_role_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

interface Account {
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  class_name: string;
  created_at: string;
}

interface VerificationCodeRecord {
  email: string;
  code: string;
  expires_at: string;
}

const inMemoryAccounts: Account[] = [];
const inMemoryVerificationCodes: VerificationCodeRecord[] = [];

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function isValidSp5Class(className: string): boolean {
  if (!className) return false;
  const clean = className.trim().toUpperCase();
  if (clean === 'ABSOLWENT SP5' || clean === 'ABSOLWENT') return true;
  const match = clean.match(/^([1-8])([A-D])$/);
  return match !== null;
}

async function verifyAndConsumeCode(emailClean: string, codeInput: string): Promise<{ success: boolean; error?: string }> {
  if (!codeInput || codeInput.trim().length !== 6) {
    return { success: false, error: 'Wpisz poprawny 6-cyfrowy kod weryfikacyjny z wiadomości e-mail.' };
  }

  const cleanCode = codeInput.trim();
  const nowIso = new Date().toISOString();

  if (!supabase) {
    const idx = inMemoryVerificationCodes.findIndex(
      v => v.email === emailClean && v.code === cleanCode && v.expires_at > nowIso
    );
    if (idx === -1) {
      return { success: false, error: 'Kod weryfikacyjny jest błędny lub wygasł. Wyślij nowy kod.' };
    }
    inMemoryVerificationCodes.splice(idx, 1);
    return { success: true };
  }

  const { data: vRecord, error: vErr } = await supabase
    .from('sp5_verification_codes')
    .select('*')
    .eq('email', emailClean)
    .eq('code', cleanCode)
    .gt('expires_at', nowIso)
    .maybeSingle();

  if (vErr) {
    return { success: false, error: 'Błąd połączenia z bazą: ' + vErr.message };
  }

  if (!vRecord) {
    return { success: false, error: 'Kod weryfikacyjny jest błędny lub wygasł. Wyślij nowy kod.' };
  }

  const { error: delErr } = await supabase
    .from('sp5_verification_codes')
    .delete()
    .eq('id', vRecord.id);

  if (delErr) {
    return { success: false, error: 'Błąd połączenia z bazą: ' + delErr.message };
  }

  return { success: true };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, email, password, new_password, first_name, last_name, class_name, code } = body;

    if (!email) {
      return NextResponse.json({ error: 'Adres Gmail jest wymagany.' }, { status: 400 });
    }

    const emailClean = email.trim().toLowerCase();

    if (action === 'send_code') {
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      console.log(`[SP5 OTP] Generated code for ${emailClean}: ${generatedCode}`);

      if (!supabase) {
        const filtered = inMemoryVerificationCodes.filter(v => v.email !== emailClean);
        inMemoryVerificationCodes.length = 0;
        inMemoryVerificationCodes.push(...filtered, { email: emailClean, code: generatedCode, expires_at: expiresAt });
      } else {
        const { error: delErr } = await supabase.from('sp5_verification_codes').delete().eq('email', emailClean);
        if (delErr) {
          return NextResponse.json({ error: 'Błąd połączenia z bazą: ' + delErr.message }, { status: 500 });
        }
        const { error: insCodeErr } = await supabase
          .from('sp5_verification_codes')
          .insert([{ email: emailClean, code: generatedCode, expires_at: expiresAt }]);
        if (insCodeErr) {
          return NextResponse.json({ error: 'Błąd połączenia z bazą: ' + insCodeErr.message }, { status: 500 });
        }
      }

      const gmailUser = process.env.GMAIL_USER;
      const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
      const resendApiKey = process.env.RESEND_API_KEY;

      try {
        if (gmailUser && gmailAppPassword) {
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: gmailUser,
              pass: gmailAppPassword
            }
          });
          await transporter.sendMail({
            from: `"Szkolna Podłoga SP5 Piastów" <${gmailUser}>`,
            to: emailClean,
            subject: 'Kod weryfikacyjny - Szkolna Podłoga SP5 Piastów',
            text: `Twój 6-cyfrowy kod weryfikacyjny to: ${generatedCode}. Kod jest ważny przez 10 minut.`,
            html: `<div style="font-family:sans-serif;padding:20px;background:#f9f9f9;border-radius:8px;max-width:500px;margin:auto;">
              <h2 style="color:#2563eb;">Szkolna Podłoga SP5 Piastów</h2>
              <p>Oto Twój jednorazowy kod weryfikacyjny:</p>
              <div style="background:#fff;border:1px solid #e5e7eb;padding:16px;border-radius:6px;text-align:center;font-size:32px;font-weight:bold;letter-spacing:6px;color:#1e293b;margin:16px 0;">
                ${generatedCode}
              </div>
              <p style="color:#64748b;font-size:14px;">Kod jest ważny przez 10 minut. Jeśli nie prosiłeś o ten kod, zignoruj tę wiadomość.</p>
            </div>`
          });
        } else if (resendApiKey) {
          const resend = new Resend(resendApiKey);
          const { error: resendError } = await resend.emails.send({
            from: 'Szkolna Podłoga SP5 <onboarding@resend.dev>',
            to: emailClean,
            subject: 'Kod weryfikacyjny - Szkolna Podłoga SP5 Piastów',
            html: `<div style="font-family:sans-serif;padding:20px;background:#f9f9f9;border-radius:8px;max-width:500px;margin:auto;">
              <h2 style="color:#2563eb;">Szkolna Podłoga SP5 Piastów</h2>
              <p>Oto Twój jednorazowy kod weryfikacyjny:</p>
              <div style="background:#fff;border:1px solid #e5e7eb;padding:16px;border-radius:6px;text-align:center;font-size:32px;font-weight:bold;letter-spacing:6px;color:#1e293b;margin:16px 0;">
                ${generatedCode}
              </div>
              <p style="color:#64748b;font-size:14px;">Kod jest ważny przez 10 minut. Jeśli nie prosiłeś o ten kod, zignoruj tę wiadomość.</p>
            </div>`
          });
          if (resendError) {
            throw new Error(resendError.message || 'Błąd wysyłki Resend');
          }
        } else {
          return NextResponse.json({
            error: 'Brak skonfigurowanych danych wysyłki e-mail (ustaw GMAIL_USER i GMAIL_APP_PASSWORD lub RESEND_API_KEY).'
          }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: 'Kod weryfikacyjny został wysłany na podany adres Gmail!' });
      } catch (mailErr: unknown) {
        const errorMessage = mailErr instanceof Error ? mailErr.message : 'Błąd SMTP/Resend';
        console.error('Mail send error:', mailErr);
        return NextResponse.json({
          error: 'Błąd wysyłki e-mail: ' + errorMessage
        }, { status: 500 });
      }
    }

    if (action === 'register') {
      if (!password || !first_name || !last_name || !class_name) {
        return NextResponse.json({ error: 'Wszystkie pola (hasło, imię, nazwisko, klasa) są wymagane.' }, { status: 400 });
      }

      const verifyRes = await verifyAndConsumeCode(emailClean, code);
      if (!verifyRes.success) {
        return NextResponse.json({ error: verifyRes.error }, { status: 400 });
      }

      if (password.trim().length < 6) {
        return NextResponse.json({ error: 'Hasło musi mieć co najmniej 6 znaków.' }, { status: 400 });
      }

      if (!isValidSp5Class(class_name)) {
        return NextResponse.json({ error: 'Nieprawidłowa klasa SP5. Wybierz klasę od 1A do 8D lub Absolwent SP5.' }, { status: 400 });
      }

      const firstNameClean = first_name.trim();
      const lastNameClean = last_name.trim();
      const classClean = class_name.trim().toUpperCase();
      const passwordHash = hashPassword(password.trim());

      if (!supabase) {
        const existing = inMemoryAccounts.find(acc => acc.email === emailClean);
        if (existing) {
          return NextResponse.json({ error: 'To konto Gmail jest już zarejestrowane – przełącz na zakładkę Zaloguj się!' }, { status: 400 });
        }

        const newAccount: Account = {
          email: emailClean,
          password_hash: passwordHash,
          first_name: firstNameClean,
          last_name: lastNameClean,
          class_name: classClean,
          created_at: new Date().toISOString()
        };
        inMemoryAccounts.push(newAccount);

        return NextResponse.json({
          success: true,
          profile: {
            firstName: firstNameClean,
            lastName: lastNameClean,
            className: classClean,
            email: emailClean
          }
        });
      }

      const { data: existingUser, error: existingErr } = await supabase
        .from('sp5_accounts')
        .select('email')
        .eq('email', emailClean)
        .maybeSingle();

      if (existingErr) {
        return NextResponse.json({ error: 'Błąd połączenia z bazą: ' + existingErr.message }, { status: 500 });
      }

      if (existingUser) {
        return NextResponse.json({ error: 'To konto Gmail jest już zarejestrowane – przełącz na zakładkę Zaloguj się!' }, { status: 400 });
      }

      const { error: insertErr } = await supabase
        .from('sp5_accounts')
        .insert([{
          email: emailClean,
          password_hash: passwordHash,
          first_name: firstNameClean,
          last_name: lastNameClean,
          class_name: classClean
        }]);

      if (insertErr) {
        return NextResponse.json({ error: 'Błąd połączenia z bazą: ' + insertErr.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        profile: {
          firstName: firstNameClean,
          lastName: lastNameClean,
          className: classClean,
          email: emailClean
        }
      });
    }

    if (action === 'login') {
      if (!password) {
        return NextResponse.json({ error: 'Podaj hasło.' }, { status: 400 });
      }

      const passwordHash = hashPassword(password.trim());

      if (!supabase) {
        const account = inMemoryAccounts.find(acc => acc.email === emailClean);
        if (!account || account.password_hash !== passwordHash) {
          return NextResponse.json({ error: 'Błędny adres Gmail lub hasło!' }, { status: 401 });
        }

        return NextResponse.json({
          success: true,
          profile: {
            firstName: account.first_name,
            lastName: account.last_name,
            className: account.class_name,
            email: account.email
          }
        });
      }

      const { data: account, error: queryErr } = await supabase
        .from('sp5_accounts')
        .select('*')
        .eq('email', emailClean)
        .maybeSingle();

      if (queryErr) {
        return NextResponse.json({ error: 'Błąd połączenia z bazą: ' + queryErr.message }, { status: 500 });
      }

      if (!account || account.password_hash !== passwordHash) {
        return NextResponse.json({ error: 'Błędny adres Gmail lub hasło!' }, { status: 401 });
      }

      return NextResponse.json({
        success: true,
        profile: {
          firstName: account.first_name,
          lastName: account.last_name,
          className: account.class_name,
          email: account.email
        }
      });
    }

    if (action === 'reset_password') {
      if (!new_password || !first_name || !class_name) {
        return NextResponse.json({ error: 'Wymagane jest nowe hasło, imię oraz klasa w celu weryfikacji tożsamości.' }, { status: 400 });
      }

      const verifyRes = await verifyAndConsumeCode(emailClean, code);
      if (!verifyRes.success) {
        return NextResponse.json({ error: verifyRes.error }, { status: 400 });
      }

      if (new_password.trim().length < 6) {
        return NextResponse.json({ error: 'Nowe hasło musi mieć co najmniej 6 znaków.' }, { status: 400 });
      }

      const newPasswordHash = hashPassword(new_password.trim());
      const fNameClean = first_name.trim().toLowerCase();
      const cNameClean = class_name.trim().toUpperCase();

      if (!supabase) {
        const account = inMemoryAccounts.find(acc => acc.email === emailClean);
        if (!account || account.first_name.toLowerCase() !== fNameClean || account.class_name.toUpperCase() !== cNameClean) {
          return NextResponse.json({ error: 'Podany adres Gmail nie zgadza się z imieniem lub klasą w bazie!' }, { status: 400 });
        }
        account.password_hash = newPasswordHash;
        return NextResponse.json({ success: true, message: 'Hasło zostało pomyślnie zmienione!' });
      }

      const { data: account, error: queryErr } = await supabase
        .from('sp5_accounts')
        .select('*')
        .eq('email', emailClean)
        .maybeSingle();

      if (queryErr) {
        return NextResponse.json({ error: 'Błąd połączenia z bazą: ' + queryErr.message }, { status: 500 });
      }

      if (!account || account.first_name.toLowerCase() !== fNameClean || account.class_name.toUpperCase() !== cNameClean) {
        return NextResponse.json({ error: 'Podany adres Gmail nie zgadza się z imieniem lub klasą w bazie!' }, { status: 400 });
      }

      const { error: updateErr } = await supabase
        .from('sp5_accounts')
        .update({ password_hash: newPasswordHash })
        .eq('email', emailClean);

      if (updateErr) {
        return NextResponse.json({ error: 'Błąd połączenia z bazą: ' + updateErr.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Hasło zostało pomyślnie zmienione!' });
    }

    return NextResponse.json({ error: 'Nieznana akcja.' }, { status: 400 });
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : 'Nieznany błąd';
    return NextResponse.json({ error: 'Wystąpił błąd serwera: ' + errMessage }, { status: 500 });
  }
}
