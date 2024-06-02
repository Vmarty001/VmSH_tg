const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');

const token = '5826846570:AAFuYkjJ-2dEpvFRGwHCLatFxsrYl7r6Oig';
const webAppUrl = 'https://vmayshop.netlify.app/';

const bot = new TelegramBot(token, {polling: true});
const app = express();

app.use(express.json());
app.use(cors());

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if(text === '/start') {
        await bot.sendMessage(chatId, 'Ниже появится кнопка, заполни форму', {
            reply_markup: {
                keyboard: [
                    [{text: 'Заполнить форму', web_app: {url: webAppUrl}}]
                ]
            }
        })

        await bot.sendMessage(chatId, 'Заходи в наш интернет магазин по кнопке ниже', {
            reply_markup: {
                inline_keyboard: [
                    [{text: 'Сделать заказ', web_app: {url: webAppUrl}}]
                ]
            }
        })
    }

    if(msg?.web_app_data?.data) {
        try {
            const data = JSON.parse(msg?.web_app_data?.data)
            const user = msg.from;  // Получение информации о пользователе
            const userName = user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.username;
            console.log(data)
            // Отправка информации о клиенте
            let message = `Спасибо за обратную связь! 🎉\n\n`;
            message += `👤 *Ваше имя:* ${userName}\n`;
            message += `📍 *Ваш город:* ${data?.city}\n`;
            message += `🏠 *Адрес доставки:* ${data?.sdekaddress}\n`;
            message += `📞 *Номер телефона:* ${data?.phone}\n\n`;
            message += `🛍️ *Ваши товары:*\n`;

            data?.addedItems.forEach((item, index) => {
                message += `\n*Товар ${index + 1}:*\n`;
                message += `🔹 *Название:* ${item.title}\n`;
                message += `🔸 *Описание:* ${item.description}\n`;
                message += `📏 *Размер:* ${item.selectedSize}\n`;
                message += `💰 *Цена:* ${item.price} ₽\n`;
            });

            // Добавляем оплату к сообщению с заказом
            await bot.sendInvoice(chatId, 
                                  'Оплата заказа', 
                                  'Оплата заказанных товаров', 
                                  'unique_payload', // Полезная нагрузка, которая будет передана обратно при успешном платеже
                                  '401643678:TEST:03413306-2d36-48a0-86d5-4adec20f7f93', // Ваш провайдер-токен
                                  'RUB', // Валюта оплаты
                                  [{label: 'Описание товара', amount: 20000}]); // Массив объектов с описанием товаров и их стоимостью

            await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

            setTimeout(async () => {
                await bot.sendMessage(chatId, 'Всю информацию вы получите в этом чате');
            }, 3000)
        } catch (e) {
            console.log(e);
        }
    }
});

app.post('/web-data', async (req, res) => {
    const {queryId, products = [], totalPrice} = req.body;
    try {
        await bot.answerWebAppQuery(queryId, {
            type: 'article',
            id: queryId,
            title: 'Успешная покупка',
            input_message_content: {
                message_text: ` Поздравляю с покупкой, вы приобрели товар на сумму ${totalPrice}, ${products.map(item => item.title).join(', ')}`
            }
        })
        return res.status(200).json({});
    } catch (e) {
        return res.status(500).json({})
    }
})

// Обработчик подтверждения готовности к оплате
bot.on('pre_checkout_query', async (ctx) => {
    try {
        await bot.answerPreCheckoutQuery(ctx.id, true);
    } catch (error) {
        console.log(error);
    }
});

// Обработчик успешного платежа
bot.on('successful_payment', async (ctx) => {
    try {
        // Обработка успешного платежа, например, отправка подтверждения и т. д.
        await bot.sendMessage(ctx.chat.id, `Спасибо за покупку! Ваши товары будут отправлены в ближайшее время.`);
    } catch (error) {
        console.log(error);
    }
});

const PORT = 8000;

app.listen(PORT, () => console.log('server started on PORT ' + PORT))
