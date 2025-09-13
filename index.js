'use strict';
const express = require('express');
const { google } = require('googleapis');
const app = express();
app.use(express.json());

// --- INFORMAÇÕES CRÍTICAS ---
const SHEET_ID = '19yxXlRTG39X547-0FUXZ6wThN-ii4akYPpfHH31uoxg';
const CREDENTIALS_FILE = './agilizabot--xwhx-f3377582eda4.json';
// --- FIM ---

const auth = new google.auth.GoogleAuth({
  keyFile: CREDENTIALS_FILE,
  scopes: 'https://www.googleapis.com/auth/spreadsheets',
});

app.post('/webhook', async (req, res) => {
  const intentName = req.body.queryResult.intent.displayName;
  let responseText = 'Desculpe, não entendi.';

  if (intentName === 'Pre_Agendamento') {
    try {
      const client = await auth.getClient();
      const sheets = google.sheets({ version: 'v4', auth: client });

      const params = req.body.queryResult.parameters;
      const telegramPayload = req.body.originalDetectIntentRequest.payload.data;
      const telegramId = telegramPayload ? telegramPayload.from.id : 'teste_console';
      
      const newRow = [
        telegramId,
        params.nome_paciente.name || params.nome_paciente,
        params.tipo_consulta,
        new Date(params.data_nascimento.split('T')[0]).toLocaleDateString('pt-br'),
        params.cpf,
        new Date(params.data_desejada.split('T')[0]).toLocaleDateString('pt-br'),
        params.periodo_dia,
        'Pendente',
        '', // data_confirmada
        '', // horario_confirmado
        'NÃO'
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: 'Página1!A:K', // Garanta que o nome da sua aba é "Página1"
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [newRow],
        },
      });

      responseText = 'Obrigado! Seu pré-agendamento foi recebido e enviado para a recepção. Você receberá uma mensagem de confirmação final em breve.';
    } catch (error) {
      console.error('ERRO FATAL AO SALVAR NA PLANILHA:', error);
      responseText = 'Desculpe, tivemos um problema CRÍTICO ao registrar seu pedido. Por favor, tente novamente mais tarde.';
    }
  }

  res.json({ fulfillmentText: responseText });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});