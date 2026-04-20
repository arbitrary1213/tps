import { Router, Request, Response } from 'express'
import { verifyURL, parseMessage, buildMessageResponse, WechatMessage, getWechatConfig, decryptMessage } from '../services/wechat'

const router = Router()

router.get('/verify', async (req: Request, res: Response) => {
  try {
    const { signature, timestamp, nonce, echostr } = req.query

    if (!signature || !timestamp || !nonce) {
      return res.status(400).send('Missing required parameters')
    }

    const result = await verifyURL({
      signature: signature as string,
      timestamp: timestamp as string,
      nonce: nonce as string,
      echostr: echostr as string | undefined
    })

    if (result.valid) {
      if (result.echostr) {
        return res.send(result.echostr)
      }
      return res.send('success')
    }

    res.status(403).send('Invalid signature')
  } catch (error) {
    console.error('WeChat verify error:', error)
    res.status(500).send('Server error')
  }
})

router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { msg_signature } = req.query
    const body = req.body.toString()

    if (!body) {
      return res.status(400).send('Missing message body')
    }

    let messageContent = body

    if (msg_signature) {
      const config = await getWechatConfig()
      if (config?.encodingAESKey) {
        const decryptResult = decryptMessage(body, config.encodingAESKey)
        if (decryptResult.success && decryptResult.message) {
          messageContent = decryptResult.message
        }
      }
    }

    const message = parseMessage(messageContent)

    if (!message) {
      return res.status(400).send('Invalid message format')
    }

    if (message.MsgType === 'event') {
      await handleEventMessage(message, res)
    } else {
      await handleTextMessage(message, res)
    }
  } catch (error) {
    console.error('WeChat message handling error:', error)
    res.status(500).send('Server error')
  }
})

async function handleEventMessage(message: WechatMessage, res: Response): Promise<void> {
  const fromUsername = message.FromUserName
  const toUsername = message.ToUserName

  switch (message.Event) {
    case 'subscribe':
      const welcomeText = '欢迎关注仙顶寺！\n\n您可以通过以下方式与我们互动：\n1. 回复"1"查看法会信息\n2. 回复"2"查看义工招募\n3. 回复"3"联系寺院'
      res.send(buildMessageResponse(fromUsername, toUsername, welcomeText))
      break

    case 'unsubscribe':
      res.send('')
      break

    case 'CLICK':
      const clickResponse = await handleMenuClick(message.EventKey!, fromUsername, toUsername)
      res.send(clickResponse)
      break

    case 'VIEW':
      res.send('')
      break

    case 'LOCATION':
      console.log(`User location: ${message.Latitude},${message.Longitude}`)
      res.send('')
      break

    default:
      res.send('')
  }
}

async function handleTextMessage(message: WechatMessage, res: Response): Promise<void> {
  const fromUsername = message.FromUserName
  const toUsername = message.ToUserName
  const content = message.Content?.trim() || ''

  let responseText = '感谢您的留言，我们会尽快回复。'

  switch (content) {
    case '1':
      responseText = '法会信息：\n\n本寺定期举办各类法会，包括：\n- 每月初一、十五诵经法会\n- 清明报恩法会\n- 中元地藏法会\n- 除夕迎新祈福法会\n\n请拨打寺院电话咨询具体时间。'
      break

    case '2':
      responseText = '义工招募：\n\n我们长期招募义工，参与寺院日常事务。\n\n服务内容包括：\n- 殿堂清洁\n- 法会协助\n- 接待引导\n- 斋堂帮厨\n\n请回复您的姓名和联系方式，我们会尽快与您联系。'
      break

    case '3':
      responseText = '联系方式：\n\n地址：浙江省某市某区仙顶寺\n电话：0571-XXXXXXX\n邮箱：xianding@vip.sina.com'
      break

    default:
      if (content.startsWith('报名')) {
        responseText = '您想报名参加什么活动？请详细说明您的姓名、联系方式和想参加的活动。'
      } else if (content.startsWith('牌位')) {
        responseText = '关于牌位供奉，请联系寺院客堂。我们提供延生禄位和往生牌位两种。'
      } else if (content.includes('地址') || content.includes('怎么走')) {
        responseText = '仙顶寺地址：浙江省某市某区仙顶寺。自驾可导航"仙顶寺"，公共交通请拨打寺院电话咨询。'
      }
  }

  res.send(buildMessageResponse(fromUsername, toUsername, responseText))
}

async function handleMenuClick(eventKey: string, fromUsername: string, toUsername: string): Promise<string> {
  switch (eventKey) {
    case 'MENU_ABOUT':
      return buildMessageResponse(fromUsername, toUsername, '仙顶寺位于浙江省，是一座历史悠久的佛教寺院。我们致力于弘扬佛法，利益众生。')
    case 'MENU_RITUAL':
      return buildMessageResponse(fromUsername, toUsername, '法会信息请致电：0571-XXXXXXX')
    case 'MENU_CONTACT':
      return buildMessageResponse(fromUsername, toUsername, '电话：0571-XXXXXXX\n邮箱：xianding@vip.sina.com\n地址：浙江省某市某区仙顶寺')
    default:
      return buildMessageResponse(fromUsername, toUsername, '感谢您的点击，我们会尽快处理您的请求。')
  }
}

export default router
