const { Telegraf } = require('telegraf');
const express = require('express');
const cors = require('cors');

const bot = new Telegraf(process.env.BOT_TOKEN); // Токен вашего бота
const app = express();

app.use(express.json());
app.use(cors());

const paymentProviderToken = '401643678:TEST:03413306-2d36-48a0-86d5-4adec20f7f93'; // Токен вашего провайдера платежей

const getInvoice = (id, totalPrice) => {
    return {
        chat_id: id,
        provider_token: paymentProviderToken,
        start_parameter: 'get_access',
        title: 'Название товара', // Название вашего товара
        description: 'Описание товара', // Описание вашего товара
        currency: 'RUB',
        prices: [{ label: 'Название товара', amount: totalPrice * 100 }], // Цена товара в копейках
        photo_url: 'https://example.com/product.jpg', // Ссылка на изображение товара
        photo_width: 500,
        photo_height: 500,
        payload: {
            unique_id: `${id}_${Date.now()}`,
            provider_token: paymentProviderToken
        }
    };
};

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') {
        await bot.sendMessage(chatId, 'Ниже появится кнопка, заполните форму', {
            reply_markup: {
                keyboard: [
                    [{ text: 'Заполнить форму', web_app: { url: webAppUrl } }]
                ]
            }
        });

        await bot.sendMessage(chatId, 'Заходите в наш интернет-магазин по кнопке ниже', {
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

            await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

            setTimeout(async () => {
                await bot.sendMessage(chatId, 'Вся информация будет отправлена в этот чат');
            }, 3000);
        } catch (e) {
            console.error('Ошибка при отправке сообщения:', e);
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
                message_text: `Поздравляем с покупкой! Вы купили товары на сумму ${totalPrice} рублей: ${products.map(item => item.title).join(', ')}`
            }
        });
        return res.status(200).json({});
    } catch (e) {
        console.error('Ошибка при отправке ответа на запрос:', e);
        return res.status(500).json({});
    }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));

bot.launch();
