const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');

const token = '5826846570:AAFuYkjJ-2dEpvFRGwHCLatFxsrYl7r6Oig';
const webAppUrl = 'https://vmayshop.netlify.app/';
const paymentProviderToken = '401643678:TEST:03413306-2d36-48a0-86d5-4adec20f7f93'; // Укажите ваш провайдерский токен здесь

const bot = new TelegramBot(token, { polling: true });
const app = express();

app.use(express.json());
app.use(cors());

const getInvoice = (chatId, totalPrice, items) => {
    return {
        chat_id: chatId,
        provider_token: paymentProviderToken,
        start_parameter: 'get_access',
        title: 'Оплата заказа',
        description: 'Оплата вашего заказа',
        currency: 'RUB',
        prices: [{ label: 'Общая стоимость', amount: totalPrice * 100 }], // цена в копейках
        payload: {
            unique_id: `${chatId}_${Number(new Date())}`,
            provider_token: paymentProviderToken
        }
    };
};

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') {
        await bot.sendMessage(chatId, 'Ниже появится кнопка, заполни форму', {
            reply_markup: {
                keyboard: [
                    [{ text: 'Заполнить форму', web_app: { url: webAppUrl } }]
                ]
            }
        });

        await bot.sendMessage(chatId, 'Заходи в наш интернет магазин по кнопке ниже', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Сделать заказ', web_app: { url: webAppUrl } }]
                ]
            }
        });
    }

    if (msg?.web_app_data?.data) {
        try {
            const data = JSON.parse(msg?.web_app_data?.data);
            const user = msg.from;
            const userName = user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.username;
            console.log(data);

            // Формируем сообщение с информацией о клиенте и товарах
            let message = `Спасибо за обратную связь! 🎉\n\n`;
            message += `👤 *Ваше имя:* ${userName}\n`;
            message += `📍 *Ваш город:* ${data?.city}\n`;
            message += `🏠 *Адрес доставки:* ${data?.sdekaddress}\n`;
            message += `📞 *Номер телефона:* ${data?.phone}\n\n`;
            message += `🛍️ *Ваши товары:*\n`;

            let totalPrice = 0;

            data?.addedItems.forEach((item, index) => {
                message += `\n*Товар ${index + 1}:*\n`;
                message += `🔹 *Название:* ${item.title}\n`;
                message += `🔸 *Описание:* ${item.description}\n`;
                message += `📏 *Размер:* ${item.selectedSize}\n`;
                message += `💰 *Цена:* ${item.price} ₽\n`;
                totalPrice += item.price;
            });

            await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

            // Отправляем инвойс
            await bot.sendInvoice(chatId, getInvoice(chatId, totalPrice, data?.addedItems));
        } catch (e) {
            console.log(e);
        }
    }
});

bot.on('pre_checkout_query', async (query) => {
    await bot.answerPreCheckoutQuery(query.id, true);
});

bot.on('successful_payment', async (msg) => {
    await bot.sendMessage(msg.chat.id, 'Платеж прошел успешно!');
});

app.post('/web-data', async (req, res) => {
    const { queryId, products = [], totalPrice } = req.body;
    try {
        await bot.answerWebAppQuery(queryId, {
            type: 'article',
            id: queryId,
            title: 'Успешная покупка',
            input_message_content: {
                message_text: `Поздравляю с покупкой, вы приобрели товар на сумму ${totalPrice}, ${products.map(item => item.title).join(', ')}`
            }
        });
        return res.status(200).json({});
    } catch (e) {
        return res.status(500).json({});
    }
});

const PORT = 8000;

app.listen(PORT, () => console.log('server started on PORT ' + PORT));
