export function createMarkdownStreamParser(onUpdate) {
  let buffer = ''
  const blocks = []

  let inCode = false
  let codeLang = ''
  let temp = ''
  let thinkingContent = '' // 专门存储思考内容

  function pushBlock() {
    if (!temp) return

    blocks.push({
      type: inCode ? 'code' : 'text',
      lang: codeLang,
      content: temp,
    })

    temp = ''
  }

  function parse(chunkObj) {
    // 如果是思考内容，直接追加到 thinkingContent
    if (chunkObj.type === 'thinking') {
      thinkingContent += chunkObj.content
      update()
      return
    }

    // 如果是普通内容，按原逻辑解析 markdown
    const chunk = chunkObj.content
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
    update()
  }

  function update() {
    onUpdate({
      thinking: thinkingContent,
      blocks: [
        ...blocks,
        temp && {
          type: inCode ? 'code' : 'text',
          lang: codeLang,
          content: temp,
        },
      ].filter(Boolean),
    })
  }

  function end() {
    pushBlock()
    update()
  }

  function getBlocks() {
    return blocks
  }

  return { parse, end, getBlocks }
}
