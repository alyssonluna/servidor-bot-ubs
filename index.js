'use strict';
const express = require('express');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const app = express();
app.use(express.json());

// --- CONFIGURAÇÕES IMPORTANTES (COLE AS SUAS INFORMAÇÕES AQUI) ---
const SHEET_ID = '19yxXlRTG39X547-0FUXZ6wThN-ii4akYPpfHH31uoxg'; // SEU SHEET ID
const GOOGLE_API_KEY = 'AIzaSyDMf0SdaoeVaHqh_Pzl-CFibJsS_qH5SrU'; // A CHAVE DE API QUE VOCÊ ACABOU DE CRIAR
// --- FIM DAS CONFIGURAÇÕES ---

const doc = new GoogleSpreadsheet(SHEET_ID);

app.post('/webhook', async (req, res) => {
  const intentName = req.body.queryResult.intent.displayName;
  let responseText = 'Desculpe, não entendi.';

  if (intentName === 'Pre_Agendamento') {
    try {
      doc.useApiKey(GOOGLE_API_KEY); // <<-- MUDANÇA IMPORTANTE AQUI
      await doc.loadInfo();
      const sheet = doc.sheetsByIndex[0];

      const params = req.body.queryResult.parameters;
      const telegramId = req.body.originalDetectIntentRequest.payload.data.from.id || 'console_test';

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
      
      await sheet.addRow(newRow); // <<-- MUDANÇA IMPORTANTE AQUI
      responseText = 'Obrigado! Seu pré-agendamento foi recebido e enviado para a recepção. Você receberá uma mensagem de confirmação final em breve.';

    } catch (error) {
      console.error('Erro ao salvar na planilha:', error);
      responseText = 'Desculpe, tivemos um problema ao registrar seu pedido. Por favor, tente novamente mais tarde.';
    }
  }
  
  const response = {
    fulfillmentText: responseText
  };
  
  res.json(response);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});