const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const https = require('https');
const fs = require('fs');

const token = '5826846570:AAFuYkjJ-2dEpvFRGwHCLatFxsrYl7r6Oig';
const webAppUrl = 'https://main--xprojectvmay.netlify.app/';
const providerToken = '401643678:TEST:03413306-2d36-48a0-86d5-4adec20f7f93';

const bot = new TelegramBot(token, { polling: true });
const app = express();

app.use(express.json());
app.use(cors());

// Подключение к базе данных
async function connectToDatabase() {
  const connection = await mysql.createConnection({
    host: '109.196.164.164',
    user: 'server',
    password: 'server290403',
    database: 'mydatabase'
  });
  return connection;
}

// Проверка подключения к базе данных
async function checkDatabaseConnection() {
  try {
    const connection = await connectToDatabase();
    console.log('Подключение к базе данных установлено.');
    await connection.end();
  } catch (err) {
    console.error('Ошибка подключения к базе данных при запуске:', err.stack);
    process.exit(1); // Завершение работы приложения при ошибке подключения
  }
}

// Обработчик команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  const webAppKeyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'Open Web App',
            web_app: { url: webAppUrl }
          }
        ]
      ]
    }
  };

  bot.sendMessage(chatId, 'Click the button below to open the web app:', webAppKeyboard);
});

// Обработка POST-запроса для добавления пользователя
app.post('/add-user', async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).send('Username is required');
  }

  try {
    const connection = await connectToDatabase();
    await connection.execute('INSERT INTO users (username) VALUES (?)', [username]);
    await connection.end();
    res.status(200).send('User added successfully');
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).send('Error adding user');
  }
});

// Загрузка сертификатов
const options = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert')
};

// Запуск сервера Express с поддержкой HTTPS
const PORT = process.env.PORT || 3000;
const server = https.createServer(options, app);

server.listen(PORT, async () => {
  console.log(`Server is running on https://localhost:${PORT}`);
  await checkDatabaseConnection(); // Проверка подключения к базе данных при запуске
});