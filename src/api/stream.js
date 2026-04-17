export async function streamChat(messages, onChunk, think = false) {
    console.log(messages)
    const userMessage = messages.filter(msg => msg.role === 'user')
    if (!userMessage.length) return
    const host = import.meta.env.VITE_API_HOST;
    const res = await fetch(`${host}/chat?text=${encodeURIComponent(userMessage[userMessage.length - 1].content)}&think=${think}`)

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
                const content = JSON.parse(json.content)


                if (content.type === 'thinking') {
                    onChunk({ type: 'thinking', content: content.content })

                } else if (content.type === 'content') {
                    onChunk({ type: 'content', content: content.content })
                }
            } catch (e) {
                console.warn('parse error', e)
            }
        }
    }
}
