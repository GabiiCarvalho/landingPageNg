require('dotenv').config();
const { google } = require('googleapis');
const readline = require('readline');

// Verifica se as variáveis de ambiente estão carregadas
if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET) {
  console.error('❌ Erro: Variáveis GMAIL_CLIENT_ID ou GMAIL_CLIENT_SECRET não encontradas no .env');
  process.exit(1);
}

const oAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  'http://localhost:5000/auth/callback'
);

const scopes = ['https://www.googleapis.com/auth/gmail.send'];

console.log('🔑 Client ID:', process.env.GMAIL_CLIENT_ID);
console.log('🔄 Gerando URL de autorização...');

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
});

console.log('\n✅ Autorize este app acessando ESTE link:\n');
console.log(authUrl);
console.log('\n➡️ Depois de autorizar, cole o código de verificação abaixo:\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Código de autorização: ', (code) => {
  oAuth2Client.getToken(code, (err, token) => {
    if (err) {
      console.error('❌ Erro ao gerar token:', err.message);
      return process.exit(1);
    }
    console.log('\n🎉 Token gerado com sucesso!');
    console.log('🔐 Refresh Token:', token.refresh_token);
    console.log('\n✅ Adicione isto ao seu .env:');
    console.log(`GMAIL_REFRESH_TOKEN=${token.refresh_token}`);
    rl.close();
    process.exit(0);
  });
});