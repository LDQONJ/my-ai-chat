export function createMarkdownStreamParser(onUpdate) {
    let buffer = ''
    let blocks = []

    let inCode = false
    let codeLang = ''
    let temp = ''

    function pushBlock() {
        if (!temp) return

        blocks.push({
            type: inCode ? 'code' : 'text',
            lang: codeLang,
            content: temp
        })

        temp = ''
    }

    function parse(chunk) {
        buffer += chunk

        let i = 0

        while (i < buffer.length) {
            // 检查是否可能是代码块标识符
            if (buffer.slice(i, i + 3) === '```') {
                // 如果后面没有换行且还没结束，说明语言标识可能还没传完，等下一块
                const newlineIndex = buffer.indexOf('\n', i + 3)
                if (!inCode && newlineIndex === -1) {
                    break
                }

                pushBlock()
                inCode = !inCode
                i += 3

                if (inCode) {
                    codeLang = buffer.slice(i, newlineIndex).trim()
                    i = newlineIndex + 1
                }

                continue
            }

            temp += buffer[i]
            i++
        }

        buffer = buffer.slice(i)

        onUpdate([
            ...blocks,
            temp && {
                type: inCode ? 'code' : 'text',
                lang: codeLang,
                content: temp
            }
        ].filter(Boolean))
    }

    function end() {
        pushBlock()
        onUpdate(blocks)
    }

    function getBlocks() {
        return blocks
    }

    return { parse, end, getBlocks }
}