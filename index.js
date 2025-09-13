'use strict';
const express = require('express');
const { WebhookClient } = require('dialogflow-fulfillment');
const { GoogleSpreadsheet } = require('google-spreadsheet');

const app = express();
app.use(express.json());

// --- CONFIGURAÇÕES IMPORTANTES (ALTERE AQUI) ---
// 1. O ID da sua planilha Google (está no meio da URL dela)
const SHEET_ID = '19yxXlRTG39X547-0FUXZ6wThN-ii4akYPpfHH31uoxg'; 
// 2. O nome do arquivo JSON com as suas credenciais
const CREDENTIALS_FILE = 'agilizabot--xwhx-28bf62f9e1ae.json'; 
// --- FIM DAS CONFIGURAÇÕES ---

const creds = require(`./${CREDENTIALS_FILE}`);
const doc = new GoogleSpreadsheet(SHEET_ID);

app.post('/webhook', (req, res) => {
  const agent = new WebhookClient({ request: req, response: res });

  async function preAgendamentoHandler(agent) {
    try {
      await doc.useServiceAccountAuth(creds);
      await doc.loadInfo();
      const sheet = doc.sheetsByIndex[0]; // Pega a primeira aba da planilha

      const params = agent.parameters;
      const telegramId = agent.originalRequest.payload.data.from.id;

      const newRow = {
        id_telegram: telegramId,
        nome_paciente: params.nome_paciente.name || params.nome_paciente,
        tipo_consulta: params.tipo_consulta,
        data_nascimento: new Date(params.data_nascimento.split('T')[0]).toLocaleDateString('pt-BR'),
        cpf: params.cpf,
        data_desejada: new Date(params.data_desejada.split('T')[0]).toLocaleDateString('pt-BR'),
        periodo_dia: params.periodo_dia,
        status_agendamento: 'Pendente',
        notificacao_enviada: 'NÃO'
      };

      await sheet.addRow(newRow);

      agent.add('Obrigado! Seu pré-agendamento foi recebido e enviado para a recepção. Você receberá uma mensagem de confirmação final em breve.');

    } catch (error) {
      console.error('Erro ao salvar na planilha:', error);
      agent.add('Desculpe, tivemos um problema ao registrar seu pedido. Por favor, tente novamente mais tarde.');
    }
  }

  let intentMap = new Map();
  intentMap.set('Pre_Agendamento', preAgendamentoHandler);
  agent.handleRequest(intentMap);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});