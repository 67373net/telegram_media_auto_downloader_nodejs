const test: number | boolean = 0;
const DEFAULT_PORT = 1328;
const fs = require('fs');
const chineseConv = require('chinese-conv');
const lx = require('67373-npm-common');
const sqlite3 = require('sqlite3');
const { Api, TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const express = require('express');
const os = require('os');
const randomstring = require("randomstring");

let db: any;
let io: any;
let gramJsClient: any;
let configsPath = './download/configs.json';
let logsPath = './download/logs.json';
let downloadLogs: any = [];
try {
  downloadLogs = fs.readFileSync(logsPath, 'utf-8');
  downloadLogs = JSON.parse(downloadLogs);
} catch { };
let logBuff = [];
let isErrDownCore = false;
let errBuff: any = {};
let configs = getConfigs();
let showTgLogin: boolean = true;
let maxMsgIds: number[] = [];
let msgBuffer: any = {};
let rangeDownInterTime: number = 1000;

main();
async function main(): Promise<void> {
  try { fs.mkdirSync('download', { recursive: true }); } catch { };
  await dbInit();
  await portInit();
  await tgLoginFromConfigs();
  setInterval(gramJsInitCheck, 1000); // 防止掉线
  startServer();
  errDown();
  realTimeDown();
  rangeDown();
  setInterval(() => {
    if (io && (logBuff.length > 0)) {
      io.to('67373.net').emit('downloadLogs', logBuff);
      logBuff = [];
    };
  }, 888);
};

async function dbInit() {
  await new Promise((resolve, reject) => {
    db = new sqlite3.Database('./download/log.db', (err: any) => {
      if (err) {
        eLog(err);
        reject(err);
      } else resolve('db initialed');
    });
  });
  let sql = `CREATE TABLE IF NOT EXISTS log `
    + ` (log_i INTEGER PRIMARY KEY AUTOINCREMENT, `
    + ` gIdAndIndex TEXT, `
    + ` msgId INTEGER, `
    + ` type TEXT, `
    + ` msgTime TEXT, `
    + ` logTime TEXT, `
    + ` link TEXT, `
    + ` status TEXT) `;
  await dbRun(sql);
  sql = `CREATE TABLE IF NOT EXISTS names `
    + ` (log_i INTEGER PRIMARY KEY AUTOINCREMENT, `
    + ` id BIGINT, `
    + ` name INTEGER, `
    + ` expire number) `;
  await dbRun(sql);
};

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const address of iface as Array<any>) {
      if (address.family === 'IPv4' && !address.internal) {
        if (address.address == '127.0.0.1') return '';
        else return address.address
      }
    }
  }
  return '';
};

async function portInit() {
  if (!configs.port) {
    console.log(`请输入端口号。默认值为：${DEFAULT_PORT}`);
    console.log(`Please input port number. Default value is: ${DEFAULT_PORT}`);
    let port = DEFAULT_PORT;
    port = await lx.clAsk('');
    configs.port = Number(port);
    if (!configs.port) configs.port = DEFAULT_PORT;
    console.log('端口被设为 | Port was set to:', configs.port);
    writeConfigs();
  };
};

async function tgLoginFromConfigs() {
  let tgParams = configs.tgParams;
  if (!tgParams.api_id || !tgParams.api_hash || !configs.stringSession) {
    showTgLogin = true;
    return 'tg login missing params.';
  }
  let options = Object.assign({}, tgParams.options);
  if (!tgParams.isProxy) {
    delete options.useWSS;
    delete options.proxy;
  }
  gramJsClient = new TelegramClient(new StringSession(configs.stringSession),
    tgParams.api_id, tgParams.api_hash, options);
  try {
    await gramJsClient.start();
  } catch (e) {
    eLog(e);
    showTgLogin = true;
    return 'tg login fail';
  };
  showTgLogin = false;
  return 'tg login success.';
};

async function gramJsInitCheck() {
  try {
    await gramJsClient.start();
    gramJsClient.setLogLevel("warn");
    for (let i in configs.downloadTasks) {
      let task = configs.downloadTasks[i];
      if (task.groupName) continue;
      if (!task.groupId) continue;
      const result = await gramJsClient
        .invoke(new Api.channels.GetChannels({ id: [task.groupId] }));
      task.groupName = result.chats[0].title;
      writeConfigs();
      io.to('67373.net').emit('getData', {
        status: {
          showConsoleLogin: false,
          showTgLogin
        },
        tgParams: configs.tgParams,
        downloadTasks: configs.downloadTasks,
        downloadLogs: downloadLogs
      });
    };
  } catch { };
};

function startServer() {
  let app = express();
  app.use(express.static('res'));
  let ip = getLocalIpAddress();
  ip = ip || '[YOUR SERVER IP]';
  const server = app.listen(configs.port, () => {
    console.log('\n\n----------------------------------')
    console.log(`\n\n服务已启动，控制台地址：http://127.0.0.1:${configs.port} 或 http://${ip}:${configs.port}。`);
    console.log(`请确保在防火墙中端口 ${configs.port} 已打开。`);
    console.log(`\nServer started, console url: http://127.0.0.1:${configs.port} or http://${ip}:${configs.port} .`);
    console.log(`Please make sure port ${configs.port} is opening in the firewall.`);
    console.log(`\n`);
  });
  io = require('socket.io')(server);
  io.on('connection', function (socket: any) {
    console.log('a user connected');
    socket.emit('init');
    socket.on('disconnect', function () { console.log('a user disconnected'); });
    socket.on('getData', (data: any) => {
      if (!checkCookie(data, socket)) return 'cookie don\'t match';
      socket.join('67373.net'); // 发送实时log的房间;
      socket.emit('getData', {
        status: {
          showConsoleLogin: false,
          showTgLogin
        },
        tgParams: configs.tgParams,
        downloadTasks: configs.downloadTasks,
        downloadLogs: downloadLogs
      });
      // socket.emit('sendData', { isTgLoggedin, tgParams: configs.tgParams });
    });
    socket.on('setPort', function (data: any) {
      if (!checkCookie(data, socket)) return 'cookie don\'t match';
      configs.port = data.port;
      writeConfigs();
      eLog(`端口更新为 ${configs.port}，重启服务后生效。| Port was changed to ${configs.port}, will take effect after server reboot.`);
    });
    socket.on('resetCookie', function (data: any) {
      if (!checkCookie(data, socket)) return 'cookie don\'t match';
      getLocalCookie(true);
      eLog(`cookie 已更新，刷新网页后需要重新登录。| cookie was changed, You'll need to log in after refreshing.`);
    });
    socket.on('setTgParams', async function (data: any) {
      if (!checkCookie(data, socket)) return 'cookie don\'t match';
      configs.tgParams = data.tgParams;
      writeConfigs();
      await tgLoginFromWebUpdate(socket);
      if (showTgLogin == false)
        socket.emit('sendData', {
          status: {
            showConsoleLogin: false,
            showTgLogin
          },
          tgParams: configs.tgParams,
          downloadTasks: configs.downloadTasks
        });
    });
    socket.on('setTasks', function (data: any) {
      if (!checkCookie(data, socket)) return 'cookie fail';
      configs.downloadTasks = data.downloadTasks;
      if (data.delIndex) downloadLogs.splice(data.delIndex, 1);
      for (let i in configs.downloadTasks) {
        if (configs.downloadTasks[i].index === undefined) {
          configs.downloadTasks[i].index = configs.indexCount;
          configs.indexCount++;
        };
      };
      writeConfigs();
    });
  });
};

function getConfigs(): Configs {
  let configs: Configs;
  if (fs.existsSync(configsPath)) {
    let str = fs.readFileSync(configsPath, 'utf-8');
    configs = JSON.parse(str);
  } else {
    configs = {
      stringSession: '',
      port: undefined, // 1328
      tgParams: {
        api_id: '',
        api_hash: '',
        isProxy: false,
        options: {
          connectionRetries: 5,
          proxy: {
            socksType: 5, // 5 | If used Socks you can choose 4 or 5.
            ip: '', // "123.123.123.123" | Proxy host (IP or hostname)
            port: 1234567890, // 123 | Proxy port
            MTProxy: false, // false | Whether it's an MTProxy or a normal Socks one
            secret: '00000000000000000000000000000000', // "00000000000000000000000000000000" | If used MTProxy then you need to provide a secret (or zeros).
            timeout: 2, // 2 | Timeout (in seconds) for connection,
          },
          useWSS: false,
        },
      },
      indexCount: 0,
      downloadTasks: [],
    };
    writeConfigs(configs);
  };
  return configs;
};

function writeConfigs(obj = configs) {
  fs.writeFileSync(configsPath, lx.jsonToStr(obj));
};

function getLocalCookie(forceNew: boolean = false): string {
  let cookie: string;
  if (forceNew || !fs.existsSync('cookie.txt')) {
    cookie = String(Math.random()).substring(2, 88);
    fs.writeFileSync('cookie.txt', cookie);
  } else {
    cookie = fs.readFileSync('cookie.txt', 'utf-8');
  };
  return cookie;
};

async function tgLoginFromWebUpdate(socket: any) {
  let tgParams = configs.tgParams;
  if (!tgParams.api_id || !tgParams.api_hash) {
    showTgLogin = true;
    eLog(`缺少 api_id 或 api_hash。| Missing api_id or api_hash.`);
    return 'tg login missing params.';
  }
  let options = Object.assign({}, tgParams.options);
  if (!tgParams.isProxy) {
    delete options.useWSS;
    delete options.proxy;
  };
  gramJsClient = new TelegramClient(new StringSession(""),
    tgParams.api_id, tgParams.api_hash, options);
  async function getFromWebPage(key: string) {
    return new Promise((resolve, reject) => {
      socket.emit(key);
      socket.on(key, (data: any) => {
        if (!checkCookie(data, socket)) return 'cookie don\'t match';
        resolve(data[key]);
      });
    });
  };
  try {
    eLog('登录中，请查看后台 log。| Logging in, you can check command line log.')
    await gramJsClient.start({
      phoneNumber: async () => await getFromWebPage('getPhoneNumber'),
      password: async () => await getFromWebPage('getPassword'),
      phoneCode: async () => await getFromWebPage('getPhoneCode'),
      onError: (e: any) => eLog(e),
    });
  } catch (e) {
    eLog(e);
    showTgLogin = true;
    return 'tg login fail';
  };
  configs.stringSession = gramJsClient.session.save();
  writeConfigs();
  socket.emit('note', '登录成功 | login success');
  showTgLogin = false;
  socket.emit('sendData', {
    status: {
      showConsoleLogin: false,
      showTgLogin
    },
    tgParams: configs.tgParams,
    downloadTasks: configs.downloadTasks
  });
  return 'tg login success.';
};

/* ❇️ ❇️ ❇️ ❇️ ❇️ ❇️ ❇️ ❇️ */

function checkCookie(data: any, socket: any) {
  if (data.cookie == getLocalCookie()) {
    // socket.emit('consoleLoggedIn');
    return true;
  } else {
    eLog("请在网页端填写 cookie。| Please input the cookie on the webpage.");
    socket.leave('67373.net'); // it's just a name
    socket.emit('consoleLoggedOut');
    return false;
  };
};

async function dbRun(...a: any) {
  return new Promise((resolve, reject) => {
    db.run(...a, (e: any) => {
      if (e) {
        eLog(e);
        reject(e);
      } else {
        resolve('dbRun done');
      };
    });
  });
};

async function dbAll(...a: any) {
  return new Promise((resolve, reject) => {
    db.all(...a, (e: any, res: any) => {
      if (e) {
        eLog(e);
        reject(e);
      } else resolve(res);
    })
  });
};

function eLog(e: any) {
  console.log(e);
  if (io) io.emit('note', lx.log(e));
};

function dLog(i: number, logs: any) {
  // texts = [].concat(texts);
  let styleObj = {
    default: ['\x1b[0m%s\x1b[0m', '<span onclick="">', '</span>'],
    green: ['\x1b[32m%s\x1b[0m', '<span style="color: #8c8" onclick="">', '</span>'],
    gray: ['\x1b[90m%s\x1b[0m', '<span style="color: #aaa" onclick="">', '</span>'],
  }
  for (let log of logs) {
    let style = styleObj[log[0]];
    if (log[2]) style[1] = style[1].replace(`onclick=""`, `onclick="copyUrl('${log[2]}')"`)
    let text: string = `${configs.downloadTasks[i].groupName.substring(0, 8)} ${log[1]}`;
    console.log(style[0], text, '\x1b[0m');
    let html = `${style[1]}${log[1]}${style[2]}`;
    if (!downloadLogs[i]) downloadLogs[i] = [];
    downloadLogs[i].push(html);
    if (downloadLogs[i].length > 288) downloadLogs[i].shift();
    fs.writeFileSync(logsPath, lx.jsonToStr(downloadLogs));
    logBuff.push({ i, html });
  };
};

async function msgToUsername(msg: any) {
  let username: string = 'unknown';
  try {
    let id = msg.fromId.userId.value;
    id = Number(id);
    let sqlStr = `SELECT * FROM names WHERE id=?`;
    let sqlArr = [id];
    let dbRet: any = await dbAll(sqlStr, sqlArr);
    if (dbRet.length > 0) {
      let expire = dbRet.expire;
      if (expire < Date.now()) username = dbRet.name;
      else username = await getUserName('update');
    } else username = await getUserName('insert');
    async function getUserName(type: string) {
      let gjRet = await gramJsClient.invoke(
        new Api.users.GetUsers({ id: [id] })
      );
      let ret: any = [];
      if (gjRet[0].firstName && gjRet[0].firstName.replace(/ㅤ/g, ''))
        ret.push(gjRet[0].firstName.replace(/ㅤ/g, ''));
      if (gjRet[0].lastName && gjRet[0].lastName.replace(/ㅤ/g, ''))
        ret.push(gjRet[0].lastName.replace(/ㅤ/g, ''));
      ret = ret.join(' ');
      if (!ret) ret = 'unknown';
      let sqlStr: string = '';
      let expire = Date.now() + 24 * 3600 * 1000;
      if (type == 'update') sqlStr = `UPDATE names SET name = ?, expire = ? WHERE id = ?`;
      else if (type == 'insert') sqlStr = `INSERT INTO names (name, expire, id) VALUES (?, ?, ?)`;
      let sqlArr = [ret, expire, id];
      await dbRun(sqlStr, sqlArr);
      return ret;
    };
  } catch { };
  return username;
}

async function mediaInfo(msg: any, index: number) {
  let filePath: string = 'download/';
  let type: string = 'non';
  let suffix: string = 'non';
  let fileName: string = '';
  let timeStamp = time2(msg.date * 1000).long;
  try { filePath += msg.peerId.channelId + '_' + index } catch { };
  let msgText = msg.message;
  let fileSize: number = 0;
  let idHash: string | undefined = undefined;
  // let username: string = await msgToUsername(msg);
  if (msg.media.className == 'MessageMediaPhoto') {
    filePath += '/photo/';
    type = 'photo';
    suffix = '.jpg';
    fileSize = msg.media.photo.sizes.filter((item: any) => item.size)[0].size;
    idHash = '' + msg.media.photo.id + msg.media.photo.accessHash;
  } else {
    let doc = msg.media.document
    idHash = '' + doc.id + doc.accessHash;
    let classNames = doc.attributes
      .map((item: any) => item.className)
      .filter((boo: any) => boo);
    fileName = doc.attributes
      .map((item: any) => item.fileName)
      .filter((boo: any) => boo)[0];
    fileName = fileName || '';
    fileSize = doc.size;
    let mimeType = doc.mimeType.split('\/');
    type = mimeType[0];
    suffix = '.' + mimeType[1];
    // filePath += '/document/';
    if (classNames.includes('DocumentAttributeAnimated')) {
      filePath += '/animation/';
      type = 'animation';
    } else if (classNames.includes('DocumentAttributeSticker')) {
      filePath += '/sticker/';
      type = 'sticker';
    } else if (classNames.includes('DocumentAttributeAudio')) {
      if (classNames.includes('DocumentAttributeVideo ')) {
        filePath += '/video/note/';
        type += '|video|note|videoNote';
        type = 'video';
      } else {
        filePath += '/audio/note/';
        type += '|audio|note|audioNote';
        type = 'audio';
      };
    } else if (type == 'video') { filePath += '/video/'; }
    else if (type == 'audio') { filePath += '/audio/'; }
    else if (suffix == '.gif') {
      filePath += '/document/gif/';
      type += '|document|animation|gif';
    } else if (type == 'image') {
      filePath += '/document/image/';
      type += '|document|image|photo';
    } else {
      filePath += '/document/';
      type += '|document'
    };
  };
  return {
    filePath, fileName, timeStamp, type,
    suffix, fileSize, msgText, idHash, /* username */
  };
};

function time2(a?: any) {
  let mon: { [key: string]: string } = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07',
    Aug: '08', Sept: '09', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
  };
  let str = a ? String(new Date(a)) : Date();
  let long = str.substring(13, 15)
    + mon[str.substring(4, 7)]
    + str.substring(8, 10)
    + '-' + str.substring(0, 3)
    + '-' + str.substring(16, 24);
  long = long.replace(/:/g, '');
  let short = str.substring(13, 15)
    + mon[str.substring(4, 7)]
    + str.substring(8, 10)
    + ' ' + str.substring(16, 24);
  short = short.replace(/:/g, '');
  return { long, short };
};

/* ❇️ ❇️ ❇️ ❇️ ❇️ ❇️ ❇️ ❇️ */

async function myIdtoMsg(groupId: any, currentId: number, maxId: number) {
  let msg: any = msgBuffer[`${groupId}_${currentId}`];
  if (msg) {
    rangeDownInterTime = 0;
    delete msgBuffer[`${groupId}_${currentId}`];
    // if (msg == 'no msg') return undefined;
    // else 
    return msg;
  };
  rangeDownInterTime = 1888;
  let endId = currentId + 99;
  endId = Math.min(maxId, endId);
  let ids = lx.arrAtoB(currentId, endId);
  let msgs = await gramJsClient.getMessages(groupId, { ids: ids });
  let n = msgs.length;
  for (let i = 0; i < n; i++) {
    let msg = msgs[i];
    let id2 = Number(currentId) + i;
    if (msg) msgBuffer[`${groupId}_${id2}`] = msg;
    else msgBuffer[`${groupId}_${id2}`] = 'no msg';
    let keys = Object.keys(msgBuffer);
    if (keys.length > 888) delete msgBuffer[keys[0]];
  };
  delete msgBuffer[`${groupId}_${currentId}`];
  return msgs[0];
};

async function errDown() {
  while (1) {
    await lx.wait(1288);
    if (showTgLogin) {
      continue;
    } else {
      let sqlStr = `SELECT * FROM log WHERE status LIKE ? ORDER BY log_i DESC`;
      let sqlArr = ['%[START]%']
      let dbRet: any = await dbAll(sqlStr, sqlArr);
      for (let i = 0; i < dbRet.length; i++) {
        let { gIdAndIndex, msgId, log_i } = dbRet[i];
        let groupId = gIdAndIndex.split('+')[0];
        let index = gIdAndIndex.split('+')[1];
        let logIndex = 0;
        for (let i in configs.downloadTasks) {
          if (configs.downloadTasks[i].index == index) logIndex = Number(i) || 0;
        };
        let errKey: string = `groupId=${groupId};msgId=${msgId}`;
        let errKeys = Object.keys(errBuff);
        if (errKeys.indexOf(errKey) == -1) {
          errBuff[errKey] = {
            index,
            msg: undefined,
            groupId,
            msgId,
            type: '🔍',
            logIndex,
            isNoDuplicateFiles: false
          }
        };
      };
      break;
    };
  };
  if (!isErrDownCore) errDownCore();
};

async function errDownCore() {
  isErrDownCore = true;
  let errKeys = Object.keys(errBuff);
  while (errKeys.length > 0) {
    let item = errBuff[errKeys[0]];
    let gIdAndIndex = item.groupId + '+' + item.index;
    let likeStr = `%${item.groupId}%`;
    let sqlStr = `SELECT * FROM log WHERE gIdAndIndex = ? AND msgId = ? ORDER BY log_i DESC`;
    let sqlArr = [gIdAndIndex, item.msgId];
    let dbRet: any = await dbAll(sqlStr, sqlArr);
    if ((dbRet.length == 0) || (dbRet[0].status.includes('['))) {
      await downFile(item);
    };
    // sqlStr = 'UPDATE log SET status = ? WHERE gIdAndIndex LIKE ? AND msgId = ? AND status LIKE ? AND log_i <= ?';
    // sqlArr = ['[errReviewed]', likeStr, msgId, '%[START]%', log_i];
    // await dbRun(sqlStr, sqlArr);
    if (dbRet.length > 0) {
      sqlStr = 'DELETE FROM log WHERE gIdAndIndex LIKE ? AND msgId = ? AND status LIKE ? AND log_i <= ?';
      sqlArr = [likeStr, item.msgId, '%[START]%', dbRet[0].log_i];
      await dbRun(sqlStr, sqlArr);
    };
    delete errBuff[errKeys[0]];
  };


  isErrDownCore = false;





  while (1) {
    await lx.wait(1288);
    if (showTgLogin) {
      continue;
    } else {
      let sqlStr = `SELECT * FROM log WHERE status LIKE ? ORDER BY log_i DESC`;
      let sqlArr = ['%[START]%']
      let dbRet: any = await dbAll(sqlStr, sqlArr);
      while (dbRet.length > 0) {
        let { gIdAndIndex, msgId, log_i } = dbRet[0];
        let groupId = gIdAndIndex.split('+')[0];
        let index = gIdAndIndex.split('+')[1];
        let likeStr = `%${groupId}%`;
        let logIndex = 0;
        for (let i in configs.downloadTasks) {
          if (configs.downloadTasks[i].index == index) logIndex = Number(i) || 0;
        };
        sqlStr = `SELECT * FROM log WHERE gIdAndIndex LIKE ? AND msgId = ? AND log_i > ? AND status NOT LIKE ?`;
        sqlArr = [likeStr, msgId, log_i, '%[START]%'];
        let dbRet2: any = await dbAll(sqlStr, sqlArr);
        if (dbRet2.length == 0) {
          await downFile({
            index,
            msg: undefined,
            groupId,
            msgId,
            type: '🔍',
            logIndex,
            isNoDuplicateFiles: false
          });
        };
        // sqlStr = 'UPDATE log SET status = ? WHERE gIdAndIndex LIKE ? AND msgId = ? AND status LIKE ? AND log_i <= ?';
        // sqlArr = ['[errReviewed]', likeStr, msgId, '%[START]%', log_i];
        // await dbRun(sqlStr, sqlArr);
        sqlStr = 'DELETE FROM log WHERE gIdAndIndex LIKE ? AND msgId = ? AND status LIKE ? AND log_i <= ?';
        sqlArr = [likeStr, msgId, '%[START]%', log_i];
        await dbRun(sqlStr, sqlArr);
        dbRet = dbRet.filter((item: any) => {
          return (!item.gIdAndIndex.includes(`${groupId}+`)) || (item.msgId != msgId)
        });
      };
      break;
    };
  };
};

async function realTimeDown() {
  let check = setInterval(() => {
    if (showTgLogin) {
      return;
    } else {
      gramJsClient.addEventHandler(async (update: any) => {
        let peerId: string | number | undefined = undefined;
        let msgId: number | undefined;
        try { peerId = '-100' + update.message.peerId.channelId } catch { };
        try { msgId = update.message.id } catch { };
        // if (test) console.log('realTimeDown', peerId, msgId);
        for (let i in configs.downloadTasks) {
          let task = configs.downloadTasks[i];
          if (task.groupId == peerId) {
            if (msgId) maxMsgIds[i] = msgId;
            if (task.isRealTimeDownload) downFile({
              index: task.index,
              msg: update.message,
              groupId: undefined,
              msgId: undefined,
              type: '⚡️',
              logIndex: i,
              isNoDuplicateFiles: task.isNoDuplicateFiles
            });
          };
        };
      });
      clearInterval(check);
    };
  }, 1000);
};

async function rangeDown() {
  let lock = false;
  while (1) {
    if (lock) {
      await lx.wait(1000);
      continue;
    };
    lock = true;
    try {
      for (let i = 0; i < configs.downloadTasks.length; i++) {
        let task = configs.downloadTasks[i];
        if (!task.isRangeDownload) continue;
        let maxId = Number(task.rangeMaxValue) || Infinity;
        if (!maxMsgIds[i]) {
          let res: any = await gramJsClient.getMessages(task.groupId, { limit: 1 });
          maxMsgIds[i] = res[0].id;
        };
        maxId = Math.min(maxId, maxMsgIds[i]);
        let currentId = Number(task.rangeMinValue) || 1;
        task.rangeMinValue = currentId;
        if (currentId > maxId) continue;
        task.rangeMinValue++;
        writeConfigs();
        io.to('67373.net').emit('addMinValue', { i, value: task.rangeMinValue });
        let msg = await myIdtoMsg(task.groupId, currentId, maxId);
        if (msg) {
          await downFile({
            index: task.index,
            msg: msg,
            groupId: task.groupId,
            msgId: currentId,
            type: '🐌',
            logIndex: i,
            isNoDuplicateFiles: task.isNoDuplicateFiles
          });
        };
      };
      lock = false;
    } catch (e) {
      eLog(e);
      lock = false;
    };
    await lx.wait(rangeDownInterTime);
  };
};

async function downFile(params: any) {
  try {
    await downFile(params);
  } catch (e) {
    errDown();








  };
}

async function downFileCore(params: any) {
  let { index, msg, groupId, msgId, type, logIndex, isNoDuplicateFiles } = params;
  let task = configs.downloadTasks[logIndex];
  let gIdAndIndex = groupId + '+' + index;
  let mInfo: any;
  let logTime = String(Date.now()); // time2().short;
  if (!msg && !(index && groupId && msgId)) {
    eLog(`downFile err: ${params}`);
    return 'missing params';
  }
  if (!msg) {
    // let sqlStr = `SELECT * FROM log WHERE gIdAndIndex = ? AND msgId = ?`;
    // let sqlArr = [gIdAndIndex, msgId];
    // let dbRet: any = await dbAll(sqlStr, sqlArr);
    // for (let item of dbRet) {
    //   if (item.status == '[NO MSG]' || item.status == '[NO MEDIA]') {
    //     let link = msgId;
    //     try {
    //       link = `t.me/c/${groupId.replace('-100', '')}/${msgId}`;
    //     } catch { };
    //     let log: any = [
    //       ['gray', `${type} ${msgId} old data: ${item.status}`, link]
    //     ];
    //     dLog(logIndex, log);
    //     return log;
    //   }
    // };
    msg = await gramJsClient.getMessages(groupId, { ids: [msgId] });
    msg = msg[0];
  };
  let status: string = '';
  let link: string = '';
  let msgTime: string = '';
  let msgTime2: string = '';
  let username = await msgToUsername(msg);
  if (!msg || msg == 'no msg') {
    status = '[NO MSG]';
  } else {
    try {
      groupId = '-100' + msg.peerId.channelId;
      gIdAndIndex = groupId + '+' + index;
    } catch { };
    try { msgId = msg.id } catch { };
    try {
      msgTime = time2(msg.date * 1000).long;
      msgTime2 = ' ' + time2(msg.date * 1000).short;
    } catch { };
    if (!msg.media) {
      status = '[NO MEDIA]';
    } else if (!msg.media.photo && !msg.media.document) {
      status = '[NO PHOTO/DOC]';
    } else {
      mInfo = await mediaInfo(msg, index);
      // if (test) console.log(mInfo);
      if (task.fileSizeMin && (mInfo.fileSize < task.fileSizeMin * 1024 * 1024))
        status = `[FILE TOO SMALL] ${(mInfo.fileSize / 1024 / 1024).toFixed(2)} mb`;
      if (task.fileSizeMax && (mInfo.fileSize > task.fileSizeMax * 1024 * 1024))
        status = `[FILE TOO BIG] ${(mInfo.fileSize / 1024 / 1024).toFixed(2)} mb`;
      let fileType = mInfo.type.split('|');
      let fileTypeCheck = fileType.filter((item: any) => task.fileType[item]);
      if (fileTypeCheck.length == 0) status = `[0TYPE] ${mInfo.type}`;
    };
  };
  link = `t.me/c/${groupId.replace('-100', '')}/${msgId}`;
  if (status) {
    let log: any = [];
    if (status != '[NO MSG]')
      log.push(['default', `${type} ${username}: ${(msg && msg.message) ? msg.message : 'null'}`]);
    log.push(['gray', `　 ${msgId}${msgTime2} ${status}`, link]);
    dLog(logIndex, log);
    return log;
    let sqlStr = `SELECT * FROM log WHERE gIdAndIndex = ? AND msgId = ? AND status = ?`;
    let sqlArr = [gIdAndIndex, msgId, status];
    let dbRet: any = await dbAll(sqlStr, sqlArr);
    if (dbRet.length == 0) {
      let sqlStr = `INSERT INTO log (gIdAndIndex, msgId, type, msgTime, logTime, link, status)`;
      sqlStr += `VALUES (?, ?, ?, ?, ?, ?, ?)`;
      // let sqlArr = [gIdAndIndex, msgId, type, msgTime, time2().long, link, status];
      let sqlArr = [gIdAndIndex, msgId, type, '', logTime, '', status];
      await dbRun(sqlStr, sqlArr);
    };
  };
  if (isNoDuplicateFiles) {
    let sqlStr = `SELECT * FROM log WHERE gIdAndIndex = ? AND status LIKE ?`;
    let sqlArr = [gIdAndIndex, `%${mInfo.idHash}%`];
    let dbRet: any = await dbAll(sqlStr, sqlArr);
    if (dbRet.length > 0) {
      // let sqlStr = `INSERT INTO log (gIdAndIndex, msgId, type, msgTime, logTime, link, status)`;
      // sqlStr += `VALUES (?, ?, ?, ?, ?, ?, ?)`;
      // // let sqlArr = [gIdAndIndex, msgId, type, msgTime, time2().long, link, mInfo.idHash];
      // let sqlArr = [gIdAndIndex, msgId, type, '', logTime, '', `[DUPLICATE]`];
      // await dbRun(sqlStr, sqlArr);
      let log = [
        ['default', `${type} ${username}: ${msg.message || 'null'}`],
        ['gray', `　 ${msgId}${msgTime2} [DUPLICATE FILE] ${mInfo.fileName || 'photo ' + mInfo.timeStamp}`, link],
      ];
      dLog(logIndex, log);
      return log;
    };
  };
  let sqlStr = `INSERT INTO log (gIdAndIndex, msgId, type, msgTime, logTime, link, status)`;
  sqlStr += `VALUES (?, ?, ?, ?, ?, ?, ?)`;
  // let logTime = time2().long;
  // let sqlArr = [gIdAndIndex, msgId, type, mInfo.timeStamp, logTime, link, 'start'];
  let sqlArr = [gIdAndIndex, msgId, type, '', logTime, '', `[START]-${mInfo.idHash}`];
  await dbRun(sqlStr, sqlArr);
  let log = [
    ['default', `${type} ${username}: ${msg.message || 'null'}`],
    ['green', `　 ${msgId}${msgTime2} [START DOWN] ${mInfo.fileName || mInfo.timeStamp}`, link],
  ];
  dLog(logIndex, log);
  try { fs.mkdirSync(mInfo.filePath, { recursive: true }); } catch { };
  let nameConf = task['fileName'];
  let fileName: any = mInfo.fileName ? [mInfo.fileName] : [];
  // if (test) console.log(nameConf);
  if (nameConf['message text'] && mInfo.msgText) fileName.unshift(mInfo.msgText);
  if (nameConf['username']) fileName.unshift(username);
  if (nameConf['time']) fileName.unshift(mInfo.timeStamp);
  fileName = fileName.join('_');
  if (!fileName) fileName = mInfo.timeStamp;
  if (mInfo.type == 'photo') fileName += mInfo.suffix;
  if (nameConf['转简体']) fileName = chineseConv.sify(fileName);
  if (nameConf['转繁体']) fileName = chineseConv.tify(fileName);
  function addAfterDot(a: string, b: string): string {
    let dotPosition = a.lastIndexOf('.');
    if (dotPosition == -1) dotPosition = Infinity;
    a = a.substring(0, dotPosition)
      + b + a.substring(dotPosition, Infinity);
    return a;
  };
  fileName = addAfterDot(fileName, randomstring.generate(8));
  fileName = lx.goodFilename(fileName);
  if (!fileName.match(/.*\.\w{1,18}$/igm)) fileName += mInfo.suffix;
  let oldFullPath = mInfo.filePath + fileName;
  let fullPath = oldFullPath;
  const buffer = await gramJsClient.downloadMedia(msg.media);
  let count = 1;
  while (fs.existsSync(fullPath)) {
    fullPath = addAfterDot(oldFullPath, String(count));
    count++;
  };
  fs.writeFileSync(fullPath, buffer);
  sqlStr = 'SELECT * FROM log WHERE gIdAndIndex = ? AND msgId = ? AND status = ?';
  sqlArr = [gIdAndIndex, msgId, mInfo.idHash];
  let dbRet: any = await dbAll(sqlStr, sqlArr);
  if (dbRet.length > 0) {
    sqlStr = 'DELETE FROM log WHERE gIdAndIndex = ? AND msgId = ? AND logTime = ? AND status LIKE ?';
    sqlArr = [gIdAndIndex, msgId, logTime, '%[START]%'];
    await dbRun(sqlStr, sqlArr);
  } else {
    sqlStr = 'UPDATE log SET status = ? WHERE gIdAndIndex = ? AND msgId = ? AND logTime = ? AND status LIKE ?';
    sqlArr = [mInfo.idHash, gIdAndIndex, msgId, logTime, '%[START]%'];
    await dbRun(sqlStr, sqlArr);
  };
  log = [
    ['green', `　 ${msgId}${msgTime2} [DONE] ${fullPath.replace(mInfo.filePath, '')}`, link],
  ];
  dLog(logIndex, log)
  return { done: true };
};

interface Configs {
  port: number | undefined, // 1328
  tgParams: {
    api_id: number | string,
    api_hash: string,
    isProxy: boolean,
    options: {
      connectionRetries: number, // 5 in official doc.
      // https://gram.js.org/getting-started/authorization#using-mtproxies-and-socks5-proxies
      // Currently only socks5,4 and MTProto proxies are supported.
      // HTTP proxies are not supported as they required a completely different connection type.
      useWSS?: boolean, // false | Important. Most proxies cannot use SSL.
      proxy?: {
        socksType?: number, // 5 | If used Socks you can choose 4 or 5.
        ip?: string, // "123.123.123.123" | Proxy host (IP or hostname)
        port?: number, // 123 | Proxy port
        MTProxy?: boolean, // false | Whether it's an MTProxy or a normal Socks one
        secret?: string, // "00000000000000000000000000000000" | If used MTProxy then you need to provide a secret (or zeros).
        timeout?: number, // 2 | Timeout (in seconds) for connection,
        [key: string]: number | string | boolean | undefined;
      },
    },
  },
  stringSession: string,
  indexCount: number,
  downloadTasks: [] | [{
    index: number,
    groupId: string | number,
    groupName: string,
    isRealTimeDownload: boolean,
    isRangeDownload: boolean,
    rangeMinValue: number,
    // rangeMinHolder: number | string,
    rangeMaxValue: number,
    // rangeMaxHolder: number | string,
    fileSizeMin: number,
    fileSizeMax: number,
    isNoDuplicateFiles: boolean,
    fileType: {
      animation: boolean,
      photo: boolean,
      video: boolean,
      document: boolean,
      audio: boolean,
      sticker: boolean,
      [key: string]: boolean;
    },
    fileName: {
      time: boolean,
      "username": boolean,
      "message text": boolean,
      "转简体": boolean,
      "转繁体": boolean,
      // "group id": boolean,
      // "username": boolean,
    }
  }],
};
/* ⚘ xrcjb ⚘ */