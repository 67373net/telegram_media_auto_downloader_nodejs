const test = 0;
const socket = io();
const { createApp } = Vue;
const DEFAULT_D_TASK = {
  groupId: '',
  groupName: '',
  isRealTimeDownload: false,
  isRangeDownload: false,
  rangeMinValue: undefined,
  // rangeMinHolder: 'default: 1',
  rangeMaxValue: undefined,
  // rangeMaxHolder: 'default: ∞',
  fileSizeMin: undefined,
  fileSizeMax: undefined,
  isNoDuplicateFiles: false,
  fileType: {
    animation: true,
    photo: true,
    video: true,
    document: true,
    audio: true,
    sticker: true,
  },
  fileName: {
    time: true,
    "username": false,
    "message text": false,
    "转简体": false,
    "转繁体": false,
  },
};

createApp({
  data() {
    return {
      mouseDivType: '',
      test: test,
      notes: test ? ['dfdsaf\nfdsfds\nfdfasf\nfsdfsdafs', 2, 3] : [],
      port: window.location.port,
      cookie: document.cookie,
      showPhoneNumber: test ? true : false,
      showPassword: test ? true : false,
      showPhoneCode: test ? true : false,
      phoneNumber: '',
      password: '',
      phoneCode: '',
      proxyTips: '',
      status: {
        showConsoleLogin: true,
        showTgLogin: test ? true : false,
        // showDownloadControl: test ? true : false,
      },
      tgParams: {
        api_id: '',
        api_hash: '',
        isProxy: false,
        options: {
          connectionRetries: 5, // 5 in official doc.
          proxy: {
            socksType: 5, // 5 | If used Socks you can choose 4 or 5.
            ip: '', // "123.123.123.123" | Proxy host (IP or hostname)
            port: 1234567890, // 123 | Proxy port
            MTProxy: false, // false | Whether it's an MTProxy or a normal Socks one
            secret: '00000000000000000000000000000000', // "00000000000000000000000000000000" | If used MTProxy then you need to provide a secret (or zeros).
            timeout: 2, // 2 | Timeout (in seconds) for connection,
          },
          useWSS: false, // false | Important. Most proxies cannot use SSL.
        },
      },
      downloadTasks: test ? [DEFAULT_D_TASK, DEFAULT_D_TASK,] : [],
      allLog: test ? [1, 2, 'fsff'] : [],
      downloadLogs: test
        ? [['ffsafdsa', '4253'],
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
        []]
        : [],
    };
  },
  watch: {
    status: {
      handler() { this.notes = []; },
      deep: true
    },
    tgParams: {
      handler() {
        this.tgParams.api_id = Number(this.tgParams.api_id);
        this.tgParams.options.proxy.socksType = Number(this.tgParams.options.proxy.socksType);
        this.tgParams.options.proxy.port = Number(this.tgParams.options.proxy.port);
      },
      deep: true
    },
    downloadLogs: {
      handler() { // 这里只能用原生js，否则滚动条有延迟。可能 flush post 有用，不过没试过
        try {
          let eles = document.querySelectorAll('.logTd');
          for (let i = 0; i < eles.length; i++) {
            let height = eles[i].clientHeight - 16;
            eles[i].querySelector('.logBox').style.height = height + 'px';
          };
        } catch { };
        let ele = document.querySelectorAll('.logBox');
        let n = ele.length
        for (let i = 0; i < n; i++) {
          let item = ele[i];
          if (!this.downloadLogs[i]) this.downloadLogs[i] = [];
          if (this.downloadLogs[i].length > 288) this.downloadLogs[i].shift();
          // item.textContent = this.downloadLogs[i].join('\n');
          item.innerHTML = this.downloadLogs[i].join('<br />');
          if (item.scrollHeight - item.scrollTop - item.clientHeight < 50) {
            item.scrollTop = item.scrollHeight;
          };
        };
      },
      deep: true
    },
    mouseDivType: {
      handler(a) {
        let div = document.querySelector('#mouseDiv');
        if (a == 'consolePort') div.innerHTML = `在这里可以修改本页面的端口号，修改后请重新启动服务端，如果你不知道这是什么，可以直接忽略。`
          + `<br />The port number of this page, will take effect after the server restart. If you don't know what it is you can ignore it.`
        else if (a == 'socksType') div.innerHTML = `If used Socks you can choose 4 or 5`
        else if (a == 'ip') div.innerHTML = `Proxy host (IP or hostname)`
        else if (a == 'port') div.innerHTML = `Proxy port`
        else if (a == 'useWss') div.innerHTML = `Important. Most proxies cannot use SSL.`
        else if (a == 'MTProxy') div.innerHTML = `Whether it\'s an MTProxy or a normal Socks one.`
        else if (a == 'secret') div.innerHTML = `If use MTProxy you need a secret (or zeros).`
        else if (a == 'groupId') div.innerHTML = `<b>如何找到群号：</b>点开这个 Telegram 机器人：<b>@username_to_id_bot</b>，点击 Chat，把群发给他。`
          + `<br /><b>How to get group id: </b>talk to this Telegram bot: <b>@username_to_id_bot</b>, click Chat, then send him the group.`
          + `<br/ >！！！有的群号前要加-100 | Some groupId may need '-100' as prefix !!!`
        else if (a == 'phoneNumber') div.innerHTML = `如果你想下载某个群中的文件，请确保当前登录的 Telegram 账号是这个群的成员。<br />`
          + `If you want to download the files from a group, make sure that the Telegram account you are currently logged in to is a member of that group.`
        else if (a == 'phoneCode') div.innerHTML = `如果短信中没有 Confirmation code，可以到 Telegram 聊天中找一哈。`
          + `<br />If there is no Confirmation code in the sms, you can look for it in Telegram chat.`
      },
      flush: 'post'
    },
    downloadTasks: {
      handler() {
        socket.emit('setTasks', { cookie: document.cookie, downloadTasks: this.downloadTasks });
      },
      deep: true
    },
    notes: {
      handler() {
        if (this.notes.length > 8) this.notes = this.notes.slice(-8);
      },
      deep: true
    },
  },
  // computed: {
  //   showTgLogin2() {
  //     console.log(this.showTgLogin, this.showPhoneNumber, this.showPassword, this.showPhoneCode);
  //     if (test) return true
  //     else return this.showTgLogin &&
  //       (this.showPhoneNumber || this.showPassword || this.showPhoneCode);
  //   },
  // },
  methods: {
    setCookie() {
      document.cookie = this.cookie;
      socket.emit('getData', { cookie: document.cookie });
    },
    setPort() {
      socket.emit('setPort', { cookie: document.cookie, port: this.port });
    },
    resetCookie() {
      socket.emit('resetCookie', { cookie: document.cookie });
      this.showConsoleLogin = true;
      this.cookie = '';
      document.cookie = '';
    },
    setTgParams() {
      socket.emit('setTgParams', { cookie: document.cookie, tgParams: this.tgParams });
    },
    getPhoneNumber() {
      socket.emit('getPhoneNumber', { cookie: document.cookie, getPhoneNumber: this.phoneNumber });
    },
    getPassword() {
      socket.emit('getPassword', { cookie: document.cookie, getPassword: this.password });
    },
    getPhoneCode() {
      socket.emit('getPhoneCode', { cookie: document.cookie, getPhoneCode: this.phoneCode });
    },
    deleteNote(i) { this.notes.splice(i, 1); },
    deleteTask(i) {
      if (confirm('确定要删除该任务吗？删除后不可恢复。\n\nAre you sure to delete this task? It\'s a no-restore opreation.')) {
        this.downloadTasks.splice(i, 1);
        this.downloadLogs.splice(i, 1);
        socket.emit('setTasks', { cookie: document.cookie, downloadTasks: this.downloadTasks });
      };
    },
    newTask() {
      this.downloadTasks.push(DEFAULT_D_TASK);
      this.downloadLogs.push([]);
    },
    getData() { socket.emit('getData', { cookie: document.cookie }) },
  },
  mounted() {
    socket.emit('getData', { cookie: document.cookie });
    socket.on('init', () => {
      socket.emit('getData', { cookie: document.cookie });
    });
    socket.on('getData', data => {
      this.status = data.status;
      this.tgParams = data.tgParams;
      this.downloadTasks = data.downloadTasks;
      // if (!this.downloadLogs.length) {
      //   this.downloadLogs = [];
      //   for (let i in this.downloadTasks) this.downloadLogs[i] = [];
      // };
    });
    socket.on('sendData', (data) => {
      this.status = data.status;
      this.tgParams = data.tgParams;
      this.downloadTasks = data.downloadTasks;
    });
    socket.on('consoleLoggedOut', () => {
      this.status.showConsoleLogin = true;
      document.cookie = '';
    });
    // socket.on('consoleLoggedIn', () => { this.showConsoleLogin = test ? true : false; });
    socket.on('getPhoneNumber', () => this.showPhoneNumber = true);
    socket.on('getPassword', () => this.showPassword = true);
    socket.on('getPhoneCode', () => this.showPhoneCode = true);
    socket.on('downloadLogs', (data) => {
      if (!this.downloadLogs[data.i]) this.downloadLogs[data.i] = [];
      this.downloadLogs[data.i].push(data.html);
    });
    socket.on('addMinValue', (data) => { this.downloadTasks[data.i].rangeMinValue = data.value });
    socket.on('note', (data) => this.notes.push(data));
    socket.emit('getData', { cookie: document.cookie });
    document.addEventListener('mousemove', (e) => {
      const mouseDiv = document.querySelector('#mouseDiv');
      if (!mouseDiv) return;
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      mouseDiv.style.left = mouseX - mouseDiv.offsetWidth / 3 + 'px';
      mouseDiv.style.top = mouseY - mouseDiv.offsetHeight - 10 + 'px';
    });
    // setInterval(() => {
    //   console.log(document.querySelector('#mouseDiv'));
    // }, 2000);
  },
}).mount('body');


// let ele = document.querySelectorAll('.logBox');
// for (let item of ele) {
//   if (item.scrollHeight - item.scrollTop - item.clientHeight < 50) {
//     item.scrollTop = item.scrollHeight;
//   };
// };


// setCookie() { sendReq(this, 'read'); },
// setConfigs() { sendReq(this, 'write'); },

// sendReq(this, "read");

// socket.on('disconnect', () => {
//   console.log('WebSocket disconnected');
//   setTimeout(() => { socket.open(); }, 5000);
// });

// function sendReq(that, rw) {
//   if (!that.logincode) { that.logincode = document.cookie; }
//   else { document.cookie = that.logincode; }
//   fetch('/', {
//     headers: { 'Content-Type': 'application/json' },
//     method: 'POST',
//     credentials: 'include',
//     body: JSON.stringify({
//       rw: rw,
//       configs: that.configs
//     })
//   })
//     .then(response => response.json())
//     .then(data => {
//       if (rw == "read") {
//         that.configs = Object.assign({}, that.configs, data);
//       };
//       console.log(rw);
//       console.log(that.configs);
//       console.log(data);
//     })
//     .catch(error => { console.error(error); });
// };