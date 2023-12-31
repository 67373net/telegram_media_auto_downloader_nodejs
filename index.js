var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var test = 0;
var DEFAULT_PORT = 1328;
var fs = require('fs');
var chineseConv = require('chinese-conv');
var lx = require('67373-npm-common');
var sqlite3 = require('sqlite3');
var _a = require("telegram"), Api = _a.Api, TelegramClient = _a.TelegramClient;
var StringSession = require("telegram/sessions").StringSession;
var express = require('express');
var os = require('os');
var randomstring = require("randomstring");
var nodeEmoji = require("node-emoji");
var db;
var io;
var gramJsClient;
var configsPath = './download/configs.json';
var logsPath = './download/logs.json';
var downloadLogs = [];
try {
    downloadLogs = fs.readFileSync(logsPath, 'utf-8');
    downloadLogs = JSON.parse(downloadLogs);
}
catch (_b) { }
;
var logBuff = [];
var isErrDownCore = false;
var errBuff = {};
var configs = getConfigs();
var showTgLogin = true;
var maxMsgIds = [];
var msgBuffer = {};
var rangeDownInterTime = 1000;
main();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    try {
                        fs.mkdirSync('download', { recursive: true });
                    }
                    catch (_b) { }
                    ;
                    return [4 /*yield*/, dbInit()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, portInit()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, tgLoginFromConfigs()];
                case 3:
                    _a.sent();
                    setInterval(gramJsInitCheck, 1000); // 防止掉线，获取群名
                    startServer();
                    errFromDb();
                    realTimeDown();
                    rangeDown();
                    setInterval(function () {
                        if (io && (logBuff.length > 0)) {
                            io.to('67373.net').emit('downloadLogs', logBuff);
                            logBuff = [];
                        }
                        ;
                    }, 888);
                    return [2 /*return*/];
            }
        });
    });
}
;
function dbInit() {
    return __awaiter(this, void 0, void 0, function () {
        var sql;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, new Promise(function (resolve, reject) {
                        db = new sqlite3.Database('./download/log.db', function (err) {
                            if (err) {
                                eLog(err);
                                reject(err);
                            }
                            else
                                resolve('db initialed');
                        });
                    })];
                case 1:
                    _a.sent();
                    sql = "CREATE TABLE IF NOT EXISTS log "
                        + " (log_i INTEGER PRIMARY KEY AUTOINCREMENT, "
                        + " gIdAndIndex TEXT, "
                        + " msgId INTEGER, "
                        + " type TEXT, "
                        + " msgTime TEXT, "
                        + " logTime TEXT, "
                        + " link TEXT, "
                        + " status TEXT) ";
                    return [4 /*yield*/, dbRun(sql)];
                case 2:
                    _a.sent();
                    sql = "CREATE TABLE IF NOT EXISTS names "
                        + " (log_i INTEGER PRIMARY KEY AUTOINCREMENT, "
                        + " id BIGINT, "
                        + " name INTEGER, "
                        + " expire number) ";
                    return [4 /*yield*/, dbRun(sql)];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
;
function getLocalIpAddress() {
    var interfaces = os.networkInterfaces();
    for (var _i = 0, _a = Object.values(interfaces); _i < _a.length; _i++) {
        var iface = _a[_i];
        for (var _b = 0, _c = iface; _b < _c.length; _b++) {
            var address = _c[_b];
            if (address.family === 'IPv4' && !address.internal) {
                if (address.address == '127.0.0.1')
                    return '';
                else
                    return address.address;
            }
        }
    }
    return '';
}
;
function portInit() {
    return __awaiter(this, void 0, void 0, function () {
        var port;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!configs.port) return [3 /*break*/, 2];
                    console.log("\u8BF7\u8F93\u5165\u7AEF\u53E3\u53F7\u3002\u9ED8\u8BA4\u503C\u4E3A\uFF1A".concat(DEFAULT_PORT));
                    console.log("Please input port number. Default value is: ".concat(DEFAULT_PORT));
                    port = DEFAULT_PORT;
                    return [4 /*yield*/, lx.clAsk('')];
                case 1:
                    port = _a.sent();
                    configs.port = Number(port);
                    if (!configs.port)
                        configs.port = DEFAULT_PORT;
                    console.log('端口被设为 | Port was set to:', configs.port);
                    writeConfigs();
                    _a.label = 2;
                case 2:
                    ;
                    return [2 /*return*/];
            }
        });
    });
}
;
function tgLoginFromConfigs() {
    return __awaiter(this, void 0, void 0, function () {
        var tgParams, options, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tgParams = configs.tgParams;
                    if (!tgParams.api_id || !tgParams.api_hash || !configs.stringSession) {
                        showTgLogin = true;
                        return [2 /*return*/, 'tg login missing params.'];
                    }
                    options = Object.assign({}, tgParams.options);
                    if (!tgParams.isProxy) {
                        delete options.useWSS;
                        delete options.proxy;
                    }
                    gramJsClient = new TelegramClient(new StringSession(configs.stringSession), tgParams.api_id, tgParams.api_hash, options);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, gramJsClient.start()];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    eLog(e_1);
                    showTgLogin = true;
                    return [2 /*return*/, 'tg login fail'];
                case 4:
                    ;
                    showTgLogin = false;
                    return [2 /*return*/, 'tg login success.'];
            }
        });
    });
}
;
function gramJsInitCheck() {
    return __awaiter(this, void 0, void 0, function () {
        var oldLog_1, _a, _b, _c, _i, i, task, result, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _e.trys.push([0, 6, , 7]);
                    return [4 /*yield*/, gramJsClient.start()];
                case 1:
                    _e.sent();
                    gramJsClient.setLogLevel("warn");
                    if (!gramJsClient._log.logReset) {
                        try {
                            oldLog_1 = gramJsClient._log.log;
                            gramJsClient._log.log = function () {
                                // console.log(123456789, ...arguments);
                                oldLog_1.apply(gramJsClient._log, arguments);
                            };
                            gramJsClient._log.logReset = true;
                        }
                        catch (_f) { }
                        ;
                    }
                    ;
                    _a = configs.downloadTasks;
                    _b = [];
                    for (_c in _a)
                        _b.push(_c);
                    _i = 0;
                    _e.label = 2;
                case 2:
                    if (!(_i < _b.length)) return [3 /*break*/, 5];
                    _c = _b[_i];
                    if (!(_c in _a)) return [3 /*break*/, 4];
                    i = _c;
                    task = configs.downloadTasks[i];
                    if (task.groupName)
                        return [3 /*break*/, 4];
                    if (!task.groupId)
                        return [3 /*break*/, 4];
                    return [4 /*yield*/, gramJsClient
                            .invoke(new Api.channels.GetChannels({ id: [task.groupId] }))];
                case 3:
                    result = _e.sent();
                    task.groupName = result.chats[0].title;
                    writeConfigs();
                    io.to('67373.net').emit('getData', {
                        status: {
                            showConsoleLogin: false,
                            showTgLogin: showTgLogin
                        },
                        tgParams: configs.tgParams,
                        downloadTasks: configs.downloadTasks,
                        downloadLogs: downloadLogs
                    });
                    _e.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    ;
                    return [3 /*break*/, 7];
                case 6:
                    _d = _e.sent();
                    return [3 /*break*/, 7];
                case 7:
                    ;
                    return [2 /*return*/];
            }
        });
    });
}
;
function startServer() {
    var app = express();
    app.use(express.static('res'));
    var ip = getLocalIpAddress();
    ip = ip || '[YOUR SERVER IP]';
    var server = app.listen(configs.port, function () {
        console.log('\n\n----------------------------------');
        console.log("\n\n\u670D\u52A1\u5DF2\u542F\u52A8\uFF0C\u63A7\u5236\u53F0\u5730\u5740\uFF1Ahttp://127.0.0.1:".concat(configs.port, " \u6216 http://").concat(ip, ":").concat(configs.port, "\u3002"));
        console.log("\u8BF7\u786E\u4FDD\u5728\u9632\u706B\u5899\u4E2D\u7AEF\u53E3 ".concat(configs.port, " \u5DF2\u6253\u5F00\u3002"));
        console.log("\nServer started, console url: http://127.0.0.1:".concat(configs.port, " or http://").concat(ip, ":").concat(configs.port, " ."));
        console.log("Please make sure port ".concat(configs.port, " is opening in the firewall."));
        console.log("\n");
    });
    io = require('socket.io')(server);
    io.on('connection', function (socket) {
        console.log('a user connected');
        socket.emit('init');
        socket.on('disconnect', function () { console.log('a user disconnected'); });
        socket.on('getData', function (data) {
            if (!checkCookie(data, socket))
                return 'cookie don\'t match';
            socket.join('67373.net'); // 发送实时log的房间;
            socket.emit('getData', {
                status: {
                    showConsoleLogin: false,
                    showTgLogin: showTgLogin
                },
                tgParams: configs.tgParams,
                downloadTasks: configs.downloadTasks,
                downloadLogs: downloadLogs
            });
            // socket.emit('sendData', { isTgLoggedin, tgParams: configs.tgParams });
        });
        socket.on('setPort', function (data) {
            if (!checkCookie(data, socket))
                return 'cookie don\'t match';
            configs.port = data.port;
            writeConfigs();
            eLog("\u7AEF\u53E3\u66F4\u65B0\u4E3A ".concat(configs.port, "\uFF0C\u91CD\u542F\u670D\u52A1\u540E\u751F\u6548\u3002| Port was changed to ").concat(configs.port, ", will take effect after server reboot."));
        });
        socket.on('resetCookie', function (data) {
            if (!checkCookie(data, socket))
                return 'cookie don\'t match';
            getLocalCookie(true);
            eLog("cookie \u5DF2\u66F4\u65B0\uFF0C\u5237\u65B0\u7F51\u9875\u540E\u9700\u8981\u91CD\u65B0\u767B\u5F55\u3002| cookie was changed, You'll need to log in after refreshing.");
        });
        socket.on('setTgParams', function (data) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!checkCookie(data, socket))
                                return [2 /*return*/, 'cookie don\'t match'];
                            configs.tgParams = data.tgParams;
                            writeConfigs();
                            return [4 /*yield*/, tgLoginFromWebUpdate(socket)];
                        case 1:
                            _a.sent();
                            if (showTgLogin == false)
                                socket.emit('sendData', {
                                    status: {
                                        showConsoleLogin: false,
                                        showTgLogin: showTgLogin
                                    },
                                    tgParams: configs.tgParams,
                                    downloadTasks: configs.downloadTasks
                                });
                            return [2 /*return*/];
                    }
                });
            });
        });
        socket.on('setTasks', function (data) {
            if (!checkCookie(data, socket))
                return 'cookie fail';
            configs.downloadTasks = data.downloadTasks;
            if (data.delIndex)
                downloadLogs.splice(data.delIndex, 1);
            for (var i in configs.downloadTasks) {
                if (configs.downloadTasks[i].index === undefined) {
                    configs.downloadTasks[i].index = configs.indexCount;
                    configs.indexCount++;
                }
                ;
            }
            ;
            writeConfigs();
        });
    });
}
;
function getConfigs() {
    var configs;
    if (fs.existsSync(configsPath)) {
        var str = fs.readFileSync(configsPath, 'utf-8');
        configs = JSON.parse(str);
    }
    else {
        configs = {
            stringSession: '',
            port: undefined,
            tgParams: {
                api_id: '',
                api_hash: '',
                isProxy: false,
                options: {
                    connectionRetries: 5,
                    proxy: {
                        socksType: 5,
                        ip: '',
                        port: 1234567890,
                        MTProxy: false,
                        secret: '00000000000000000000000000000000',
                        timeout: 2, // 2 | Timeout (in seconds) for connection,
                    },
                    useWSS: false,
                },
            },
            indexCount: 0,
            downloadTasks: [],
        };
        writeConfigs(configs);
    }
    ;
    return configs;
}
;
function writeConfigs(obj) {
    if (obj === void 0) { obj = configs; }
    fs.writeFileSync(configsPath, lx.jsonToStr(obj));
}
;
function getLocalCookie(forceNew) {
    if (forceNew === void 0) { forceNew = false; }
    var cookie;
    if (forceNew || !fs.existsSync('cookie.txt')) {
        cookie = String(Math.random()).substring(2, 88);
        fs.writeFileSync('cookie.txt', cookie);
    }
    else {
        cookie = fs.readFileSync('cookie.txt', 'utf-8');
    }
    ;
    return cookie;
}
;
function tgLoginFromWebUpdate(socket) {
    return __awaiter(this, void 0, void 0, function () {
        function getFromWebPage(key) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, new Promise(function (resolve, reject) {
                            socket.emit(key);
                            socket.on(key, function (data) {
                                if (!checkCookie(data, socket))
                                    return 'cookie don\'t match';
                                resolve(data[key]);
                            });
                        })];
                });
            });
        }
        var tgParams, options, e_2;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tgParams = configs.tgParams;
                    if (!tgParams.api_id || !tgParams.api_hash) {
                        showTgLogin = true;
                        eLog("\u7F3A\u5C11 api_id \u6216 api_hash\u3002| Missing api_id or api_hash.");
                        return [2 /*return*/, 'tg login missing params.'];
                    }
                    options = Object.assign({}, tgParams.options);
                    if (!tgParams.isProxy) {
                        delete options.useWSS;
                        delete options.proxy;
                    }
                    ;
                    gramJsClient = new TelegramClient(new StringSession(""), tgParams.api_id, tgParams.api_hash, options);
                    ;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    eLog('登录中，请查看后台 log。| Logging in, you can check command line log.');
                    return [4 /*yield*/, gramJsClient.start({
                            phoneNumber: function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, getFromWebPage('getPhoneNumber')];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            }); }); },
                            password: function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, getFromWebPage('getPassword')];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            }); }); },
                            phoneCode: function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, getFromWebPage('getPhoneCode')];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            }); }); },
                            onError: function (e) { return eLog(e); },
                        })];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    e_2 = _a.sent();
                    eLog(e_2);
                    showTgLogin = true;
                    return [2 /*return*/, 'tg login fail'];
                case 4:
                    ;
                    configs.stringSession = gramJsClient.session.save();
                    writeConfigs();
                    socket.emit('note', '登录成功 | login success');
                    showTgLogin = false;
                    socket.emit('sendData', {
                        status: {
                            showConsoleLogin: false,
                            showTgLogin: showTgLogin
                        },
                        tgParams: configs.tgParams,
                        downloadTasks: configs.downloadTasks
                    });
                    return [2 /*return*/, 'tg login success.'];
            }
        });
    });
}
;
/* ❇️ ❇️ ❇️ ❇️ ❇️ ❇️ ❇️ ❇️ */
function checkCookie(data, socket) {
    if (data.cookie == getLocalCookie()) {
        // socket.emit('consoleLoggedIn');
        return true;
    }
    else {
        eLog("请在网页端填写 cookie。| Please input the cookie on the webpage.");
        socket.leave('67373.net'); // it's just a name
        socket.emit('consoleLoggedOut');
        return false;
    }
    ;
}
;
function dbRun() {
    var a = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        a[_i] = arguments[_i];
    }
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    db.run.apply(db, __spreadArray(__spreadArray([], a, false), [function (e) {
                            if (e) {
                                eLog(e);
                                reject(e);
                            }
                            else {
                                resolve('dbRun done');
                            }
                            ;
                        }], false));
                })];
        });
    });
}
;
function dbAll() {
    var a = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        a[_i] = arguments[_i];
    }
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    db.all.apply(db, __spreadArray(__spreadArray([], a, false), [function (e, res) {
                            if (e) {
                                eLog(e);
                                reject(e);
                            }
                            else
                                resolve(res);
                        }], false));
                })];
        });
    });
}
;
function eLog(e) {
    console.log(e);
    if (io)
        io.emit('note', lx.log(e));
}
;
function dLog(i, logs) {
    // texts = [].concat(texts);
    var styleObj = {
        default: ['\x1b[0m%s\x1b[0m', '<span onclick="">', '</span>'],
        green: ['\x1b[32m%s\x1b[0m', '<span style="color: #8c8" onclick="">', '</span>'],
        gray: ['\x1b[90m%s\x1b[0m', '<span style="color: #aaa" onclick="">', '</span>'],
    };
    for (var _i = 0, logs_1 = logs; _i < logs_1.length; _i++) {
        var log = logs_1[_i];
        var style = styleObj[log[0]];
        if (log[2])
            style[1] = style[1].replace("onclick=\"\"", "onclick=\"copyUrl('".concat(log[2], "')\""));
        var text = "".concat(configs.downloadTasks[i].groupName.substring(0, 8), " ").concat(log[1]);
        console.log(style[0], text, '\x1b[0m');
        var html = "".concat(style[1]).concat(log[1]).concat(style[2]);
        if (!downloadLogs[i])
            downloadLogs[i] = [];
        downloadLogs[i].push(html);
        if (downloadLogs[i].length > 288)
            downloadLogs[i].shift();
        fs.writeFileSync(logsPath, lx.jsonToStr(downloadLogs));
        logBuff.push({ i: i, html: html });
    }
    ;
}
;
function msgToUsername(msg) {
    return __awaiter(this, void 0, void 0, function () {
        function getUserName(type) {
            return __awaiter(this, void 0, void 0, function () {
                var gjRet, ret, sqlStr, expire, sqlArr;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, gramJsClient.invoke(new Api.users.GetUsers({ id: [id_1] }))];
                        case 1:
                            gjRet = _a.sent();
                            ret = [];
                            if (gjRet[0].firstName && gjRet[0].firstName.replace(/ㅤ/g, ''))
                                ret.push(gjRet[0].firstName.replace(/ㅤ/g, ''));
                            if (gjRet[0].lastName && gjRet[0].lastName.replace(/ㅤ/g, ''))
                                ret.push(gjRet[0].lastName.replace(/ㅤ/g, ''));
                            ret = ret.join(' ');
                            if (!ret)
                                ret = 'unknown';
                            sqlStr = '';
                            expire = Date.now() + 24 * 3600 * 1000;
                            if (type == 'update')
                                sqlStr = "UPDATE names SET name = ?, expire = ? WHERE id = ?";
                            else if (type == 'insert')
                                sqlStr = "INSERT INTO names (name, expire, id) VALUES (?, ?, ?)";
                            sqlArr = [ret, expire, id_1];
                            return [4 /*yield*/, dbRun(sqlStr, sqlArr)];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, ret];
                    }
                });
            });
        }
        var username, id_1, sqlStr, sqlArr, dbRet, expire, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    username = 'unknown';
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 9, , 10]);
                    id_1 = msg.fromId.userId.value;
                    id_1 = Number(id_1);
                    sqlStr = "SELECT * FROM names WHERE id=?";
                    sqlArr = [id_1];
                    return [4 /*yield*/, dbAll(sqlStr, sqlArr)];
                case 2:
                    dbRet = _b.sent();
                    if (!(dbRet.length > 0)) return [3 /*break*/, 6];
                    expire = dbRet.expire;
                    if (!(expire < Date.now())) return [3 /*break*/, 3];
                    username = dbRet.name;
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, getUserName('update')];
                case 4:
                    username = _b.sent();
                    _b.label = 5;
                case 5: return [3 /*break*/, 8];
                case 6: return [4 /*yield*/, getUserName('insert')];
                case 7:
                    username = _b.sent();
                    _b.label = 8;
                case 8:
                    ;
                    return [3 /*break*/, 10];
                case 9:
                    _a = _b.sent();
                    return [3 /*break*/, 10];
                case 10:
                    ;
                    return [2 /*return*/, username];
            }
        });
    });
}
function mediaInfo(msg, index) {
    return __awaiter(this, void 0, void 0, function () {
        var filePath, type, suffix, fileName, timeStamp, msgText, fileSize, idHash, doc, classNames, mimeType;
        return __generator(this, function (_a) {
            filePath = 'download/';
            type = 'non';
            suffix = 'non';
            fileName = '';
            timeStamp = time2(msg.date * 1000).long;
            try {
                filePath += msg.peerId.channelId + '_' + index;
            }
            catch (_b) { }
            ;
            msgText = msg.message;
            fileSize = 0;
            idHash = undefined;
            // let username: string = await msgToUsername(msg);
            if (msg.media.className == 'MessageMediaPhoto') {
                filePath += '/photo/';
                type = 'photo';
                suffix = '.jpg';
                fileSize = msg.media.photo.sizes.filter(function (item) { return item.size; })[0].size;
                idHash = '' + msg.media.photo.id + msg.media.photo.accessHash;
            }
            else {
                doc = msg.media.document;
                idHash = '' + doc.id + doc.accessHash;
                classNames = doc.attributes
                    .map(function (item) { return item.className; })
                    .filter(function (boo) { return boo; });
                fileName = doc.attributes
                    .map(function (item) { return item.fileName; })
                    .filter(function (boo) { return boo; })[0];
                fileName = fileName || '';
                fileSize = doc.size;
                mimeType = doc.mimeType.split('\/');
                type = mimeType[0];
                suffix = '.' + mimeType[1];
                // filePath += '/document/';
                if (classNames.includes('DocumentAttributeAnimated')) {
                    filePath += '/animation/';
                    type = 'animation';
                }
                else if (classNames.includes('DocumentAttributeSticker')) {
                    filePath += '/sticker/';
                    type = 'sticker';
                }
                else if (classNames.includes('DocumentAttributeAudio')) {
                    if (classNames.includes('DocumentAttributeVideo ')) {
                        filePath += '/video/note/';
                        type += '|video|note|videoNote';
                        type = 'video';
                    }
                    else {
                        filePath += '/audio/note/';
                        type += '|audio|note|audioNote';
                        type = 'audio';
                    }
                    ;
                }
                else if (type == 'video') {
                    filePath += '/video/';
                }
                else if (type == 'audio') {
                    filePath += '/audio/';
                }
                else if (suffix == '.gif') {
                    filePath += '/document/gif/';
                    type += '|document|animation|gif';
                }
                else if (type == 'image') {
                    filePath += '/document/image/';
                    type += '|document|image|photo';
                }
                else {
                    filePath += '/document/';
                    type += '|document';
                }
                ;
            }
            ;
            return [2 /*return*/, {
                    filePath: filePath,
                    fileName: fileName,
                    timeStamp: timeStamp,
                    type: type,
                    suffix: suffix,
                    fileSize: fileSize,
                    msgText: msgText,
                    idHash: idHash,
                }];
        });
    });
}
;
function time2(a) {
    var mon = {
        Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07',
        Aug: '08', Sept: '09', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
    };
    var str = a ? String(new Date(a)) : Date();
    var long = str.substring(13, 15)
        + mon[str.substring(4, 7)]
        + str.substring(8, 10)
        + '-' + str.substring(0, 3)
        + '-' + str.substring(16, 24);
    long = long.replace(/:/g, '');
    var short = str.substring(13, 15)
        + mon[str.substring(4, 7)]
        + str.substring(8, 10)
        + ' ' + str.substring(16, 24);
    short = short.replace(/:/g, '');
    return { long: long, short: short };
}
;
/* ❇️ ❇️ ❇️ ❇️ ❇️ ❇️ ❇️ ❇️ */
function myIdtoMsg(groupId, currentId, maxId) {
    return __awaiter(this, void 0, void 0, function () {
        var msg, endId, ids, msgs, n, i, msg_1, id2, keys;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    msg = msgBuffer["".concat(groupId, "_").concat(currentId)];
                    if (msg) {
                        rangeDownInterTime = 0;
                        delete msgBuffer["".concat(groupId, "_").concat(currentId)];
                        // if (msg == 'no msg') return undefined;
                        // else 
                        return [2 /*return*/, msg];
                    }
                    ;
                    rangeDownInterTime = 1888;
                    endId = currentId + 99;
                    endId = Math.min(maxId, endId);
                    ids = lx.arrAtoB(currentId, endId);
                    return [4 /*yield*/, gramJsClient.getMessages(groupId, { ids: ids })];
                case 1:
                    msgs = _a.sent();
                    n = msgs.length;
                    for (i = 0; i < n; i++) {
                        msg_1 = msgs[i];
                        id2 = Number(currentId) + i;
                        if (msg_1)
                            msgBuffer["".concat(groupId, "_").concat(id2)] = msg_1;
                        else
                            msgBuffer["".concat(groupId, "_").concat(id2)] = 'no msg';
                        keys = Object.keys(msgBuffer);
                        if (keys.length > 888)
                            delete msgBuffer[keys[0]];
                    }
                    ;
                    delete msgBuffer["".concat(groupId, "_").concat(currentId)];
                    return [2 /*return*/, msgs[0]];
            }
        });
    });
}
;
function errFromDb() {
    return __awaiter(this, void 0, void 0, function () {
        var sqlStr, sqlArr, dbRet, i, _a, gIdAndIndex, msgId, log_i, groupId, index, logIndex, i_1, errKey, errKeys;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!1) return [3 /*break*/, 5];
                    return [4 /*yield*/, lx.wait(1288)];
                case 1:
                    _b.sent();
                    if (!showTgLogin) return [3 /*break*/, 2];
                    return [3 /*break*/, 0];
                case 2:
                    sqlStr = "SELECT * FROM log WHERE status LIKE ? ORDER BY log_i DESC";
                    sqlArr = ['%[START]%'];
                    return [4 /*yield*/, dbAll(sqlStr, sqlArr)];
                case 3:
                    dbRet = _b.sent();
                    for (i = 0; i < dbRet.length; i++) {
                        _a = dbRet[i], gIdAndIndex = _a.gIdAndIndex, msgId = _a.msgId, log_i = _a.log_i;
                        groupId = gIdAndIndex.split('+')[0];
                        index = gIdAndIndex.split('+')[1];
                        logIndex = 0;
                        for (i_1 in configs.downloadTasks) {
                            if (configs.downloadTasks[i_1].index == index)
                                logIndex = Number(i_1) || 0;
                        }
                        ;
                        errKey = "groupId=".concat(groupId, ";msgId=").concat(msgId);
                        errKeys = Object.keys(errBuff);
                        if (errKeys.indexOf(errKey) == -1) {
                            errBuff[errKey] = {
                                index: index,
                                msg: undefined,
                                groupId: groupId,
                                msgId: msgId,
                                type: '🔍',
                                logIndex: logIndex,
                                isNoDuplicateFiles: false
                            };
                        }
                        ;
                    }
                    ;
                    return [3 /*break*/, 5];
                case 4:
                    ;
                    return [3 /*break*/, 0];
                case 5:
                    ;
                    errDown();
                    return [2 /*return*/];
            }
        });
    });
}
;
function errDown() {
    return __awaiter(this, void 0, void 0, function () {
        var errKeys, item, gIdAndIndex, likeStr, sqlStr, sqlArr, dbRet;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (isErrDownCore)
                        return [2 /*return*/];
                    isErrDownCore = true;
                    errKeys = Object.keys(errBuff);
                    _a.label = 1;
                case 1:
                    if (!(errKeys.length > 0)) return [3 /*break*/, 7];
                    item = errBuff[errKeys[0]];
                    gIdAndIndex = item.groupId + '+' + item.index;
                    likeStr = "%".concat(item.groupId, "%");
                    sqlStr = "SELECT * FROM log WHERE gIdAndIndex = ? AND msgId = ? ORDER BY log_i DESC";
                    sqlArr = [gIdAndIndex, item.msgId];
                    return [4 /*yield*/, dbAll(sqlStr, sqlArr)];
                case 2:
                    dbRet = _a.sent();
                    if (!((dbRet.length == 0) || (dbRet[0].status.includes('[')))) return [3 /*break*/, 4];
                    return [4 /*yield*/, downFile(item)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    ;
                    if (!(dbRet.length > 0)) return [3 /*break*/, 6];
                    sqlStr = 'DELETE FROM log WHERE gIdAndIndex LIKE ? AND msgId = ? AND status LIKE ? AND log_i <= ?';
                    sqlArr = [likeStr, item.msgId, '%[START]%', dbRet[0].log_i];
                    return [4 /*yield*/, dbRun(sqlStr, sqlArr)];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6:
                    ;
                    delete errBuff[errKeys[0]];
                    errKeys = Object.keys(errBuff);
                    return [3 /*break*/, 1];
                case 7:
                    ;
                    isErrDownCore = false;
                    return [2 /*return*/];
            }
        });
    });
}
;
function realTimeDown() {
    return __awaiter(this, void 0, void 0, function () {
        var check;
        var _this = this;
        return __generator(this, function (_a) {
            check = setInterval(function () {
                if (showTgLogin) {
                    return;
                }
                else {
                    gramJsClient.addEventHandler(function (update) { return __awaiter(_this, void 0, void 0, function () {
                        var peerId, msgId, i, task;
                        return __generator(this, function (_a) {
                            peerId = undefined;
                            try {
                                peerId = '-100' + update.message.peerId.channelId;
                            }
                            catch (_b) { }
                            ;
                            try {
                                msgId = update.message.id;
                            }
                            catch (_c) { }
                            ;
                            // if (test) console.log('realTimeDown', peerId, msgId);
                            for (i in configs.downloadTasks) {
                                task = configs.downloadTasks[i];
                                if (task.groupId == peerId) {
                                    if (msgId)
                                        maxMsgIds[i] = msgId;
                                    if (task.isRealTimeDownload)
                                        downFile({
                                            index: task.index,
                                            msg: update.message,
                                            groupId: undefined,
                                            msgId: undefined,
                                            type: '⚡️',
                                            logIndex: i,
                                            isNoDuplicateFiles: task.isNoDuplicateFiles
                                        });
                                }
                                ;
                            }
                            ;
                            return [2 /*return*/];
                        });
                    }); });
                    clearInterval(check);
                }
                ;
            }, 1000);
            return [2 /*return*/];
        });
    });
}
;
function rangeDown() {
    return __awaiter(this, void 0, void 0, function () {
        var lock, i, task, maxId, res, currentId, msg, e_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    lock = false;
                    _a.label = 1;
                case 1:
                    if (!1) return [3 /*break*/, 16];
                    if (!lock) return [3 /*break*/, 3];
                    return [4 /*yield*/, lx.wait(1000)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 1];
                case 3:
                    ;
                    lock = true;
                    _a.label = 4;
                case 4:
                    _a.trys.push([4, 13, , 14]);
                    i = 0;
                    _a.label = 5;
                case 5:
                    if (!(i < configs.downloadTasks.length)) return [3 /*break*/, 12];
                    task = configs.downloadTasks[i];
                    if (!task.isRangeDownload)
                        return [3 /*break*/, 11];
                    maxId = Number(task.rangeMaxValue) || Infinity;
                    if (!!maxMsgIds[i]) return [3 /*break*/, 7];
                    return [4 /*yield*/, gramJsClient.getMessages(task.groupId, { limit: 1 })];
                case 6:
                    res = _a.sent();
                    maxMsgIds[i] = res[0].id;
                    _a.label = 7;
                case 7:
                    ;
                    maxId = Math.min(maxId, maxMsgIds[i]);
                    currentId = Number(task.rangeMinValue) || 1;
                    task.rangeMinValue = task.rangeMinValue || currentId;
                    if (currentId > maxId)
                        return [3 /*break*/, 11];
                    task.rangeMinValue++;
                    writeConfigs();
                    io.to('67373.net').emit('addMinValue', { i: i, value: task.rangeMinValue });
                    return [4 /*yield*/, myIdtoMsg(task.groupId, currentId, maxId)];
                case 8:
                    msg = _a.sent();
                    if (!msg) return [3 /*break*/, 10];
                    return [4 /*yield*/, downFile({
                            index: task.index,
                            msg: msg,
                            groupId: task.groupId,
                            msgId: currentId,
                            type: '🐌',
                            logIndex: i,
                            isNoDuplicateFiles: task.isNoDuplicateFiles
                        })];
                case 9:
                    _a.sent();
                    _a.label = 10;
                case 10:
                    ;
                    _a.label = 11;
                case 11:
                    i++;
                    return [3 /*break*/, 5];
                case 12:
                    ;
                    lock = false;
                    return [3 /*break*/, 14];
                case 13:
                    e_3 = _a.sent();
                    eLog(e_3);
                    lock = false;
                    return [3 /*break*/, 14];
                case 14:
                    ;
                    return [4 /*yield*/, lx.wait(rangeDownInterTime)];
                case 15:
                    _a.sent();
                    return [3 /*break*/, 1];
                case 16:
                    ;
                    return [2 /*return*/];
            }
        });
    });
}
;
function downFile(params) {
    return __awaiter(this, void 0, void 0, function () {
        var e_4, groupId, msgId, errKey, errKeys;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, downFileCore(params)];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    e_4 = _a.sent();
                    groupId = params.groupId, msgId = params.msgId;
                    errKey = "groupId=".concat(groupId, ";msgId=").concat(msgId);
                    errKeys = Object.keys(errBuff);
                    if (errKeys.indexOf(errKey) == -1) {
                        errBuff[errKey] = Object.assign({}, params, {
                            type: '🔍',
                            isNoDuplicateFiles: false
                        });
                    }
                    ;
                    errDown();
                    eLog(e_4);
                    return [3 /*break*/, 3];
                case 3:
                    ;
                    return [2 /*return*/];
            }
        });
    });
}
;
function downFileCore(params) {
    return __awaiter(this, void 0, void 0, function () {
        function addAfterDot(a, b) {
            var dotPosition = a.lastIndexOf('.');
            if (dotPosition == -1)
                dotPosition = Infinity;
            a = a.substring(0, dotPosition)
                + b + a.substring(dotPosition, Infinity);
            return a;
        }
        var index, msg, groupId, msgId, type, logIndex, isNoDuplicateFiles, task, gIdAndIndex, mInfo, logTime, status, link, msgTime, msgTime2, username, fileType, fileTypeCheck, log_1, sqlStr_1, sqlArr_1, dbRet_1, sqlStr_2, sqlArr_2, sqlStr_3, sqlArr_3, dbRet_2, log_2, sqlStr, sqlArr, log, nameConf, fileName, oldFullPath, fullPath, buffer, count, dbRet;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    index = params.index, msg = params.msg, groupId = params.groupId, msgId = params.msgId, type = params.type, logIndex = params.logIndex, isNoDuplicateFiles = params.isNoDuplicateFiles;
                    task = configs.downloadTasks[logIndex];
                    gIdAndIndex = groupId + '+' + index;
                    logTime = String(Date.now());
                    if (!msg && !(index && groupId && msgId)) {
                        eLog("downFile err: ".concat(params));
                        return [2 /*return*/, 'missing params'];
                    }
                    if (!!msg) return [3 /*break*/, 2];
                    return [4 /*yield*/, gramJsClient.getMessages(groupId, { ids: [msgId] })];
                case 1:
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
                    msg = _a.sent();
                    msg = msg[0];
                    _a.label = 2;
                case 2:
                    ;
                    status = '';
                    link = '';
                    msgTime = '';
                    msgTime2 = '';
                    return [4 /*yield*/, msgToUsername(msg)];
                case 3:
                    username = _a.sent();
                    if (!(!msg || msg == 'no msg')) return [3 /*break*/, 4];
                    status = '[NO MSG]';
                    return [3 /*break*/, 9];
                case 4:
                    try {
                        groupId = '-100' + msg.peerId.channelId;
                        gIdAndIndex = groupId + '+' + index;
                    }
                    catch (_b) { }
                    ;
                    try {
                        msgId = msg.id;
                    }
                    catch (_c) { }
                    ;
                    try {
                        msgTime = time2(msg.date * 1000).long;
                        msgTime2 = ' ' + time2(msg.date * 1000).short;
                    }
                    catch (_d) { }
                    ;
                    if (!!msg.media) return [3 /*break*/, 5];
                    status = '[NO MEDIA]';
                    return [3 /*break*/, 8];
                case 5:
                    if (!(!msg.media.photo && !msg.media.document)) return [3 /*break*/, 6];
                    status = '[NO PHOTO/DOC]';
                    return [3 /*break*/, 8];
                case 6: return [4 /*yield*/, mediaInfo(msg, index)];
                case 7:
                    mInfo = _a.sent();
                    // if (test) console.log(mInfo);
                    if (task.fileSizeMin && (mInfo.fileSize < task.fileSizeMin * 1024 * 1024))
                        status = "[FILE TOO SMALL] ".concat((mInfo.fileSize / 1024 / 1024).toFixed(2), " mb");
                    if (task.fileSizeMax && (mInfo.fileSize > task.fileSizeMax * 1024 * 1024))
                        status = "[FILE TOO BIG] ".concat((mInfo.fileSize / 1024 / 1024).toFixed(2), " mb");
                    fileType = mInfo.type.split('|');
                    fileTypeCheck = fileType.filter(function (item) { return task.fileType[item]; });
                    if (fileTypeCheck.length == 0)
                        status = "[0TYPE] ".concat(mInfo.type);
                    _a.label = 8;
                case 8:
                    ;
                    _a.label = 9;
                case 9:
                    ;
                    link = "t.me/c/".concat(groupId.replace('-100', ''), "/").concat(msgId);
                    if (!status) return [3 /*break*/, 13];
                    log_1 = [];
                    if (status != '[NO MSG]')
                        log_1.push(['default', "".concat(type, " ").concat(username, ": ").concat((msg && msg.message) ? msg.message : 'null')]);
                    log_1.push(['gray', "\u3000 ".concat(msgId).concat(msgTime2, " ").concat(status), link]);
                    dLog(logIndex, log_1);
                    return [2 /*return*/, log_1];
                case 10:
                    dbRet_1 = _a.sent();
                    if (!(dbRet_1.length == 0)) return [3 /*break*/, 12];
                    sqlStr_2 = "INSERT INTO log (gIdAndIndex, msgId, type, msgTime, logTime, link, status)";
                    sqlStr_2 += "VALUES (?, ?, ?, ?, ?, ?, ?)";
                    sqlArr_2 = [gIdAndIndex, msgId, type, '', logTime, '', status];
                    return [4 /*yield*/, dbRun(sqlStr_2, sqlArr_2)];
                case 11:
                    _a.sent();
                    _a.label = 12;
                case 12:
                    ;
                    _a.label = 13;
                case 13:
                    ;
                    if (!isNoDuplicateFiles) return [3 /*break*/, 15];
                    sqlStr_3 = "SELECT * FROM log WHERE gIdAndIndex = ? AND status LIKE ?";
                    sqlArr_3 = [gIdAndIndex, "%".concat(mInfo.idHash, "%")];
                    return [4 /*yield*/, dbAll(sqlStr_3, sqlArr_3)];
                case 14:
                    dbRet_2 = _a.sent();
                    if (dbRet_2.length > 0) {
                        log_2 = [
                            ['default', "".concat(type, " ").concat(username, ": ").concat(msg.message || 'null')],
                            ['gray', "\u3000 ".concat(msgId).concat(msgTime2, " [DUPLICATE FILE] ").concat(mInfo.fileName || 'photo ' + mInfo.timeStamp), link],
                        ];
                        dLog(logIndex, log_2);
                        return [2 /*return*/, log_2];
                    }
                    ;
                    _a.label = 15;
                case 15:
                    ;
                    sqlStr = "INSERT INTO log (gIdAndIndex, msgId, type, msgTime, logTime, link, status)";
                    sqlStr += "VALUES (?, ?, ?, ?, ?, ?, ?)";
                    sqlArr = [gIdAndIndex, msgId, type, '', logTime, '', "[START]-".concat(mInfo.idHash)];
                    return [4 /*yield*/, dbRun(sqlStr, sqlArr)];
                case 16:
                    _a.sent();
                    log = [
                        ['default', "".concat(type, " ").concat(username, ": ").concat(msg.message || 'null')],
                        ['green', "\u3000 ".concat(msgId).concat(msgTime2, " [START DOWN] ").concat(mInfo.fileName || mInfo.timeStamp), link],
                    ];
                    dLog(logIndex, log);
                    try {
                        fs.mkdirSync(mInfo.filePath, { recursive: true });
                    }
                    catch (_e) { }
                    ;
                    nameConf = task['fileName'];
                    fileName = mInfo.fileName ? [mInfo.fileName] : [];
                    // if (test) console.log(nameConf);
                    if (nameConf['message text'] && mInfo.msgText)
                        fileName.unshift(mInfo.msgText);
                    if (nameConf['username'])
                        fileName.unshift(username);
                    if (nameConf['time'])
                        fileName.unshift(mInfo.timeStamp);
                    fileName = fileName.join('_');
                    if (!fileName)
                        fileName = mInfo.timeStamp;
                    if (mInfo.type == 'photo')
                        fileName += mInfo.suffix;
                    if (nameConf['转简体'])
                        fileName = chineseConv.sify(fileName);
                    if (nameConf['转繁体'])
                        fileName = chineseConv.tify(fileName);
                    if (nameConf['no emoji'])
                        fileName = nodeEmoji.unemojify(fileName);
                    ;
                    fileName = addAfterDot(fileName, randomstring.generate(8));
                    fileName = lx.goodFilename(fileName);
                    if (!fileName.match(/.*\.\w{1,18}$/igm))
                        fileName += mInfo.suffix;
                    oldFullPath = mInfo.filePath + fileName;
                    fullPath = oldFullPath;
                    return [4 /*yield*/, gramJsClient.downloadMedia(msg.media)];
                case 17:
                    buffer = _a.sent();
                    count = 1;
                    while (fs.existsSync(fullPath)) {
                        fullPath = addAfterDot(oldFullPath, String(count));
                        count++;
                    }
                    ;
                    fs.writeFileSync(fullPath, buffer);
                    sqlStr = 'SELECT * FROM log WHERE gIdAndIndex = ? AND msgId = ? AND status = ?';
                    sqlArr = [gIdAndIndex, msgId, mInfo.idHash];
                    return [4 /*yield*/, dbAll(sqlStr, sqlArr)];
                case 18:
                    dbRet = _a.sent();
                    if (!(dbRet.length > 0)) return [3 /*break*/, 20];
                    sqlStr = 'DELETE FROM log WHERE gIdAndIndex = ? AND msgId = ? AND logTime = ? AND status LIKE ?';
                    sqlArr = [gIdAndIndex, msgId, logTime, '%[START]%'];
                    return [4 /*yield*/, dbRun(sqlStr, sqlArr)];
                case 19:
                    _a.sent();
                    return [3 /*break*/, 22];
                case 20:
                    sqlStr = 'UPDATE log SET status = ? WHERE gIdAndIndex = ? AND msgId = ? AND logTime = ? AND status LIKE ?';
                    sqlArr = [mInfo.idHash, gIdAndIndex, msgId, logTime, '%[START]%'];
                    return [4 /*yield*/, dbRun(sqlStr, sqlArr)];
                case 21:
                    _a.sent();
                    _a.label = 22;
                case 22:
                    ;
                    log = [
                        ['green', "\u3000 ".concat(msgId).concat(msgTime2, " [DONE] ").concat(fullPath.replace(mInfo.filePath, '')), link],
                    ];
                    dLog(logIndex, log);
                    return [2 /*return*/, { done: true }];
            }
        });
    });
}
;
;
/* ⚘ xrcjb ⚘ */ 
