const { google } = require('googleapis');
const readline = require('readline');

const oAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  'http://localhost:5000/auth/callback'
);

const scopes = ['https://www.googleapis.com/auth/gmail.send'];

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
});

console.log('Autorize este app acessando:', authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Cole o código da URL de redirecionamento aqui: ', (code) => {
  oAuth2Client.getToken(code, (err, token) => {
    if (err) return console.error('Erro ao gerar token:', err);
    console.log('Refresh token:', token.refresh_token);
    rl.close();
  });
});