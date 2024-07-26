const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');

const token = '5826846570:AAFuYkjJ-2dEpvFRGwHCLatFxsrYl7r6Oig';
//const webAppUrl = 'https://vmayshop.netlify.app/';
const webAppUrl = 'https://vmayshop.netlify.app/';
const providerToken = '401643678:TEST:03413306-2d36-48a0-86d5-4adec20f7f93';

const bot = new TelegramBot(token, { polling: true });
const app = express();

app.use(express.json());
app.use(cors());

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') {
        await bot.sendMessage(chatId, 'Переходи в наш магазин по кнопке ниже!', {
            reply_markup: {
                keyboard: [
                    [{ text: 'Открыть магазин', web_app: { url: webAppUrl } }]
                ]
            }
        });
    }

    if (msg?.web_app_data?.data) {
        try {
            const data = JSON.parse(msg?.web_app_data?.data);
            const user = msg.from;  // Получение информации о пользователе
            const userName = user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.username;
            console.log(data);

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

            // Отправка сообщения о заказе
            await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

            // Отправка счета на оплату
            const prices = data?.addedItems.map((item) => ({
                label: item.title,
                amount: item.price * 100 // Цена в копейках
            }));

            if (prices.length === 0) {
                await bot.sendMessage(chatId, 'Произошла ошибка: не указаны товары для оплаты.');
                return;
            }

            await bot.sendInvoice(
                chatId,
                'Оплата заказа',
                'Оплата заказа в нашем магазине',
                'payload', // payload - это информация, которая передаётся в платеж
                providerToken, // Замените на ваш provider token
                'some_random_string_key', // Замените на ваш уникальный ключ
                'RUB',
                prices,
            );

            bot.on('pre_checkout_query', async (query) => {
                try {
                    await bot.answerPreCheckoutQuery(query.id, true);
                } catch (error) {
                    console.log(error);
                }
            });

            bot.on('successful_payment', async (msg) => {
                try {
                    await bot.sendMessage(chatId, `Спасибо за оплату ${msg.successful_payment.invoice_payload}!`);
                } catch (error) {
                    console.log(error);
                }
            });

        } catch (e) {
            console.log(e);
            await bot.sendMessage(chatId, 'Произошла ошибка при обработке данных. Попробуйте позже.');
        }
    }
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
