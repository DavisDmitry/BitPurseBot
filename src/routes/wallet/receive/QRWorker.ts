import { Encoder } from '@nuintun/qrcode'

addEventListener('message', (event) => {
  postMessage(new Encoder().write(`bitcoin:${event.data}`).make().toDataURL(192, 0))
})
