import axios from 'axios';
export async function streamChat(messages, onChunk, think = false) {
    console.log(messages)
    const userMessage = messages.filter(msg => msg.role === 'user')
    if (!userMessage.length) return
    const host = import.meta.env.VITE_API_HOST;
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
        headers['Authorization'] = `${token}`;
    }

    axios.create({baseURL: host, timeout: 60000,}).post('/chat', {
        sessionId,
        text: userMessage[userMessage.length - 1].content,
        think
    })

    const res = await fetch(`${host}/chat?text=${encodeURIComponent(userMessage[userMessage.length - 1].content)}&think=${think}`, {
        headers
    })

    const reader = res.body.getReader()
    // eslint-disable-next-line no-undef
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
