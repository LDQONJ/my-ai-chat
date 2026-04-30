import axios from 'axios'
import { wsManager } from '../utils/websocket'

export async function streamChat(
  messages,
  onChunk,
  think = false,
  prompt = false,
  signal,
  modelId,
  search = false,
  audio = null,
) {
  console.log(messages)
  const userMessage = messages.filter(msg => msg.role === 'user')
  if (!userMessage.length) return
  const host = import.meta.env.VITE_API_HOST
  const token = localStorage.getItem('token')
  const headers = {}
  if (token) {
    headers['Authorization'] = `${token}`
  }

  const res = await fetch(`${host}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({
      sessionId: localStorage.getItem('sessionId'),
      text: userMessage[userMessage.length - 1].content,
      think,
      prompt,
      modelId,
      search,
      audio,
      wsId: wsManager.getWsId(),
    }),
    signal,
  })

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`)
  }

  const contentType = res.headers.get('Content-Type')
  if (contentType && contentType.includes('application/json')) {
    const json = await res.json()
    throw new Error(json.msg || '请求失败')
  }

  const reader = res.body.getReader()

  const decoder = new TextDecoder('utf-8')

  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop()

    for (const line of lines) {
      if (!line.trim()) continue

      try {
        const jsonLine = line.substring(5).trim()
        // console.log(jsonLine)

        const json = JSON.parse(jsonLine)

        if (json.content) {
          onChunk(json)
        }
      } catch (e) {
        console.warn('parse error', e)
      }
    }
  }
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

export async function generateTitle(id, onChunk) {
  const host = import.meta.env.VITE_API_HOST
  const token = localStorage.getItem('token')
  const headers = {}
  if (token) {
    headers['Authorization'] = `${token}`
  }
  const res = await fetch(`${host}/session/title/${id}`, {
    headers: {
      ...headers,
    },
  })
  const reader = res.body.getReader()
  const decoder = new TextDecoder('utf-8')

  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop()

    for (const line of lines) {
      if (!line.trim()) continue

      try {
        const jsonLine = line.substring(5).trim()
        // console.log(jsonLine)

        const json = JSON.parse(jsonLine)

        if (json.content) {
          await delay(100)
          onChunk(json)
        }
      } catch (e) {
        console.warn('parse error', e)
      }
    }
  }
}

export async function streamASR(fileName, onChunk) {
  const host = import.meta.env.VITE_API_HOST
  const token = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'text/plain',
  }
  if (token) {
    headers['Authorization'] = `${token}`
  }

  const res = await fetch(`${host}/audio/streamASR`, {
    method: 'POST',
    headers: headers,
    body: fileName, // 直接发送字符串作为请求体
  })

  if (!res.ok) {
    throw new Error(`ASR error! status: ${res.status}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder('utf-8')

  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop()

    for (const line of lines) {
      if (!line.trim()) continue

      try {
        // 兼容 "data: " 前缀
        const jsonLine = line.startsWith('data:') ? line.substring(5).trim() : line.trim()
        if (!jsonLine) continue

        const json = JSON.parse(jsonLine)

        if (json.content) {
          await delay(50)
          onChunk(json)
        }
      } catch (e) {
        console.warn('parse error', e, 'on line:', line)
      }
    }
  }
}