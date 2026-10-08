const axios = require('axios')

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendLogMessage(text) {
    try {
        await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
            "chat_id": process.env.ADMIN_ID,
            'text': text,
            "parse_mode": "HTML"
        })
    } catch(e) {
        await sleep(5000);
        await sendLogMessage(text);
    }
}

async function sendAdminLogMessage(text, chat_id) {
    try {
        await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
            "chat_id": chat_id,
            'text': text,
            "parse_mode": "HTML"
        })
    } catch(e) {
        await sleep(5000);
        await sendAdminLogMessage(text, chat_id);
    }
}


async function sendWorkerLogMessage(text, chat_id) {
    await axios.post(`https://api.telegram.org/bot${process.env.WORKER_BOT_TOKEN}/sendMessage`, {
        "chat_id": chat_id,
        'text': text,
        "parse_mode": "HTML"
    })
}

module.exports.sendLogMessage = sendLogMessage;
module.exports.sendWorkerLogMessage = sendWorkerLogMessage;
module.exports.sendAdminLogMessage = sendAdminLogMessage;
