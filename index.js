const https = require('https');
const fs = require('fs');

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