
import "onsenui/css/onsenui.css"
import "onsenui/js/onsenui.min.js"
import "onsenui/css/dark-onsen-css-components.min.css"

let ws = new WebSocket('wss://gpio-ui.herokuapp.com/ws/ui')
setInterval(() => {
  ws.send(JSON.stringify({id: "ping"}));
}, 20000);


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

ws.addEventListener('message', function (event) {
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
