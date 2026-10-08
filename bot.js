const dotenv = require('dotenv');
dotenv.config();
const db = require('better-sqlite3')('./db/database.db');
const { Bot, Keyboard, InlineKeyboard, session, GrammyError } = require("grammy");
const {
    conversations,
    createConversation,
  } = require("@grammyjs/conversations");

const bot = new Bot(process.env.WORKER_BOT_TOKEN);

async function nakla(conversation, ctx) {
    await ctx.reply("<b>Введите накладную в формате</b>\nВ сборке\n55.5535818:37.8913002\niPhone 15\n15000\nВалакас Глад\nМосква\nИванов Иван\n+79254545398\nМосква, Красная площадь, д.1, кв.25", {parse_mode: "HTML"})
    const titleCtx = await conversation.waitFor(":text");
    const delet = db.prepare('DELETE FROM nakl WHERE telega = ?').run(ctx.chat.id);
    const insert = db.prepare('INSERT INTO nakl (telega, text) VALUES (?, ?)').run(ctx.chat.id, titleCtx.msg.text);
    await ctx.reply("<b>Накладная создана</b>", {parse_mode: "HTML"})
    return;
}

async function admin_new(conversation, ctx) {
    await ctx.reply("<b>Введите ID телеграм</b>", {parse_mode: "HTML"})
    const titleCtx = await conversation.waitFor(":text");
    const upd = db.prepare('UPDATE users SET admin = 1 WHERE telega = ?').run(titleCtx.msg.text);
    await ctx.reply("<b>Админ добавлен</b>", {parse_mode: "HTML"})
    return;
}

async function admin_del(conversation, ctx) {
    await ctx.reply("<b>Введите ID телеграм</b>", {parse_mode: "HTML"})
    const titleCtx = await conversation.waitFor(":text");
    const upd = db.prepare('UPDATE users SET admin = 0 WHERE telega = ?').run(titleCtx.msg.text);
    await ctx.reply("<b>Админ удален</b>", {parse_mode: "HTML"})
    return;
}

bot.use(session({
    initial() {
      // return empty object for now
      return {};
    },
}));

bot.use(conversations());
bot.use(createConversation(nakla));
bot.use(createConversation(admin_new));
bot.use(createConversation(admin_del));

bot.command("start", async (ctx) => {
    const keyboard = new Keyboard().resized().text("Накладная")
    const row = db.prepare('SELECT * FROM users WHERE telega = ?').get(ctx.chat.id);
    if (typeof row === 'undefined') {
        const insert = db.prepare('INSERT INTO users (telega) VALUES (?)').run(ctx.chat.id);
    } else {
        if (row.admin == 1) keyboard.add().row().text("Админы")
    }
    //try {
    	await ctx.reply("<b>Ваш Telegram ID:</b> <code>" + ctx.chat.id.toString() + "</code>", {parse_mode: "HTML", reply_markup: keyboard})
    //} catch(e) {}
});

bot.hears("Накладная", async (ctx) => {
    const user = db.prepare('SELECT * FROM users WHERE telega = ?').get(ctx.chat.id);
    if (typeof user === 'undefined') return
    const row = db.prepare('SELECT text FROM nakl WHERE telega = ?').get(ctx.chat.id);
    console.log(row)
    var texto = "У вас пока нет накладной";
    const inlineKeyboard = new InlineKeyboard()
        .text("Создать новую", 'create_new').row()
    if (typeof row !== 'undefined') texto = row.text;
    await ctx.reply(texto, { reply_markup: inlineKeyboard });
});

bot.hears("Админы", async (ctx) => {
    const user = db.prepare('SELECT * FROM users WHERE telega = ?').get(ctx.chat.id);
    if (typeof user === 'undefined') return
    if (user.admin == 0) return;

    const row = db.prepare('SELECT * FROM users WHERE admin = 1').all();
    console.log(row)
    var texto = "Админы:";
    for (admin of row) {
        texto += `\n${admin.telega}`
    }
    const inlineKeyboard = new InlineKeyboard()
        .text("Удалить админа", 'admin_delete').row()
        .text("Добавить админа", 'admin_create')
    await ctx.reply(texto, { reply_markup: inlineKeyboard });
});

bot.callbackQuery("create_new", async (ctx) => {
    await ctx.conversation.enter("nakla");
});

bot.callbackQuery("admin_create", async (ctx) => {
    await ctx.conversation.enter("admin_new");
});

bot.callbackQuery("admin_delete", async (ctx) => {
    await ctx.conversation.enter("admin_del");
});

bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof GrammyError) {
      console.error("Error in request:", e.description);
    } else if (e instanceof HttpError) {
      console.error("Could not contact Telegram:", e);
    } else {
      console.error("Unknown error:", e);
    }
  });

bot.start();
