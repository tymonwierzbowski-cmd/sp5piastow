import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_role_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

let inMemoryAccounts: any[] = [];

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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, email, password, new_password, first_name, last_name, class_name } = body;

    if (!email) {
      return NextResponse.json({ error: 'Adres Gmail jest wymagany.' }, { status: 400 });
    }

    const emailClean = email.trim().toLowerCase();

    if (action === 'register') {
      if (!password || !first_name || !last_name || !class_name) {
        return NextResponse.json({ error: 'Wszystkie pola (hasło, imię, nazwisko, klasa) są wymagane.' }, { status: 400 });
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

        const newAccount = {
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

      // Check if account already exists
      const { data: existingUser, error: checkErr } = await supabase
        .from('sp5_accounts')
        .select('email')
        .eq('email', emailClean)
        .maybeSingle();

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
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
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

      if (queryErr || !account || account.password_hash !== passwordHash) {
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

      if (queryErr || !account || account.first_name.toLowerCase() !== fNameClean || account.class_name.toUpperCase() !== cNameClean) {
        return NextResponse.json({ error: 'Podany adres Gmail nie zgadza się z imieniem lub klasą w bazie!' }, { status: 400 });
      }

      const { error: updateErr } = await supabase
        .from('sp5_accounts')
        .update({ password_hash: newPasswordHash })
        .eq('email', emailClean);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Hasło zostało pomyślnie zmienione!' });
    }

    return NextResponse.json({ error: 'Nieznana akcja.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Wystąpił błąd serwera: ' + err.message }, { status: 500 });
  }
}
