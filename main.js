
import "onsenui/css/onsenui.css"
import ons from "onsenui/js/onsenui.js"
import "onsenui/css/dark-onsen-css-components.min.css"

const url = import.meta.env.VITE_WS != undefined ? import.meta.env.VITE_WS : 'wss://gpio-ui.herokuapp.com/ws/ui'

let ws = {

  wsobj : undefined,
  retry : 0,

  send: function(msg) {
    this.wsobj.send(msg)
  },

  init : function() {
    const _this = this
    setInterval(() => {
      if (_this.wsobj == undefined) return
      _this.wsobj.send(JSON.stringify({id: "ping"}));
    }, 20000);

    this.init2()
  },

  init2: function() {
    const _this = this
    const wsobj = new WebSocket(url)

    wsobj.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data)
      if (msg.id == "init") {
        msg.payload.forEach(item => {
          addOrUpdate(item)
        });
      } else if (msg.id == "update") {
        update(msg.payload)
      } else if (msg.id == "add") {
        addOrUpdate(msg.payload)
        console.log(msg)
      } else {
        console.log(msg)
      }
    })

    wsobj.addEventListener('error', (event) => {
      if (wsobj.readyState == WebSocket.CLOSED) {
        if (_this.retry == 0) {
          if (_this.onConnectFailed != undefined) {
            _this.onConnectFailed()
          }
          _this.retry++
        }
      } else {
        if (_this.onConnectFailed != undefined) {
          _this.onError()
        }
        wsobj.close()
      }

    })

    wsobj.addEventListener('open', (event) => {
      _this.retry = 0
      _this.wsobj = wsobj
      if (_this.onConnected != undefined) {
        _this.onConnected()
      }
  })

    wsobj.addEventListener('close', (event) => {
      setTimeout(() => _this.init2(), 1000)
      
      if (_this.wsobj != undefined && _this.onDisconnected != undefined) {
        _this.onDisconnected()
      }
      _this.wsobj = undefined
    })

  }
}

ws.onConnectFailed = () => {
  ons.notification.toast('Connection au serveur impossible', { timeout: 5000 });
}

ws.onError = () => {
  ons.notification.toast("Une erreur s'est produite", { timeout: 5000 })
}

ws.onConnected = () => {
  document.getElementById("cstate").setAttribute("style", "color: white")
  document.querySelectorAll("ons-switch").forEach(sw => {
    sw.disabled = false
  });
}

ws.onDisconnected = () => {
  document.getElementById("cstate").setAttribute("style", "color: red")
  document.querySelectorAll("ons-switch").forEach(sw => {
    sw.disabled = true
  });
}

ws.init()

function add(item) {
  const elem = document.createElement("ons-list-item")
  elem.setAttribute("id", `itm:${item.id}`)
  elem.innerHTML = 
    ` <div class="center">
        ${item.description}
      </div>
      <div class="right">
        <ons-switch id="sw:${item.id}"></ons-switch>
      </div>`
  document.getElementById("list").appendChild(elem)

  const sw = document.getElementById(`sw:${item.id}`)
  sw.addEventListener('change', function(a) { change(item.id, a.value) })
  if (item.value == 1) {
    sw.checked = true
  }
}

function update(item) {
  
  if (item.description != undefined) {
    const itm = document.getElementById(`itm:${item.id}`)
    itm.description = item.description
  }

  if (item.value != undefined) {
    const sw = document.getElementById(`sw:${item.id}`)
    if (item.value == 1) {
      sw.checked = true
    } else {
      sw.checked = false
    }
  }
}

function addOrUpdate(item) {
  const itm = document.getElementById(`itm:${item.id}`)
  if (itm != null) {
    update(item)
  } else {
    add(item)
    return
  }
}

function change(id, value) {
  ws.send(JSON.stringify({id: "value", payload: {id, value : value ? 1 : 0}}))
}

