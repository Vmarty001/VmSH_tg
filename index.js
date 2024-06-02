const { Telegraf } = require('telegraf');
const express = require('express');
const cors = require('cors');

const token = '5826846570:AAFuYkjJ-2dEpvFRGwHCLatFxsrYl7r6Oig';
const webAppUrl = 'https://vmayshop.netlify.app/';

const bot = new Telegraf(token);
const app = express();

app.use(express.json());
app.use(cors());

bot.start((ctx) => {
    ctx.reply('Ниже появится кнопка, заполни форму', {
        reply_markup: {
            keyboard: [
                [{ text: 'Заполнить форму', url: webAppUrl }]
            ]
        }
    });

    ctx.reply('Заходи в наш интернет магазин по кнопке ниже', {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Сделать заказ', url: webAppUrl }]
            ]
        }
    });
});

bot.on('message', async (ctx) => {
    const chatId = ctx.chat.id;
    const text = ctx.message.text;

    if (text === '/start') {
        // Необходимый код уже в обработчике start
    }

    if (ctx.message?.web_app) {
        try {
            const data = JSON.parse(ctx.message.web_app);
            const user = ctx.message.from;
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

            await ctx.replyWithMarkdown(message);

            setTimeout(async () => {
                await ctx.reply('Вся информация будет отправлена в этот чат');
            }, 3000);
        } catch (e) {
            console.log(e);
        }
    }
});

app.post('/web-data', async (req, res) => {
    const { queryId, products = [], totalPrice } = req.body;
    try {
        await bot.telegram.answerCbQuery(queryId, {
            text: ` Поздравляю с покупкой, вы приобрели товар на сумму ${totalPrice}, ${products.map(item => item.title).join(', ')}`
        });
        return res.status(200).json({});
    } catch (e) {
        return res.status(500).json({})
    }
});

const PORT = 8000;

app.listen(PORT, () => console.log('server started on PORT ' + PORT))
