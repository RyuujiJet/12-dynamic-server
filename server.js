var http = require('http')
var fs = require('fs')
var url = require('url')
var port = process.argv[2]

if (!port) {
    console.log('请指定端口号好不啦？\nnode server.js 8888 这样不会吗？')
    process.exit(1)
}

var server = http.createServer(function (request, response) {
    var parsedUrl = url.parse(request.url, true)
    var pathWithQuery = request.url
    var queryString = ''
    if (pathWithQuery.indexOf('?') >= 0) { queryString = pathWithQuery.substring(pathWithQuery.indexOf('?')) }
    var path = parsedUrl.pathname
    var query = parsedUrl.query
    var method = request.method

    /******** 从这里开始看，上面不要看 ************/

    console.log('发请求过来啦！路径（带查询参数）为：' + pathWithQuery)
    const session = JSON.parse(fs.readFileSync('./session.json').toString())
    if (path === "/sign-in" && method === "POST") {
      response.setHeader('Content-Type', 'text/html; charset=utf-8')
      let array = []
      const userArray = JSON.parse(fs.readFileSync('./db/users.json').toString())
      request.on('data', (trunk) => {
        array.push(trunk)
      })
      request.on('end', () => {
        const obj = JSON.parse(Buffer.concat(array).toString())
        const user = userArray.find(user => user.name === obj.name && user.password === obj.password)
        if (user) {
          response.statusCode = 200
          const random = Math.random()
          session[random] = {user_id: user.id}
          fs.writeFileSync('./session.json', JSON.stringify(session))
          response.setHeader('Set-Cookie', `session_id=${random}`)
          response.end()
        } else {
          response.statusCode = 400
          response.end('用户名密码错误')
        }
      })
    } else if (path === "/home.html") {
      const userArray = JSON.parse(fs.readFileSync('./db/users.json').toString())
      const cookie = request.headers['cookie']
      let string = null
      const homeHtml = fs.readFileSync('./public/home.html').toString()
      if (cookie) {
        const loginSessionId = cookie.split(';').filter(i => i.indexOf('session_id') >= 0)[0].split('=')[1]
        const user = userArray.find(i => +i.id === +session[loginSessionId].user_id)
        if (user) {
          string = homeHtml.replace('{{loginStatus}}', `${user.name}已登录`)
        } else {
          string = homeHtml.replace('{{loginStatus}}', '未登录')
        }
        response.write(string)
        response.end()
      } else {
        string = homeHtml.replace('{{loginStatus}}', '未登录')
        response.write(string)
        response.end()
      }
    } else if (path === "/register" && method === "POST") {
      response.setHeader('Content-Type', 'text/html; charset=utf-8')
      let array = []
      const userArray = JSON.parse(fs.readFileSync('./db/users.json').toString())
      request.on('data', (trunk) => {
        array.push(trunk)
      })
      request.on('end', () => {
        const string = Buffer.concat(array).toString()
        const obj = JSON.parse(string)
        const newUser = {
          id: userArray.length ? userArray[userArray.length - 1].id + 1 : 1,
          name: obj.name,
          password: obj.password
        }
        userArray.push(newUser)
        fs.writeFileSync('./db/users.json', JSON.stringify(userArray))
        response.end()
      })
    } else {
      response.statusCode = 200
      const filePath = path === '/' ? '/index.html' : path
      const index = filePath.lastIndexOf('.')
      const suffix = filePath.substring(index)
      const fielType = {
        '.html': 'text/html',
        '.javascript': 'text/javascript',
        '.css': 'text/css',
        'png': 'image/png',
        'jpg': 'image/jpeg'
      }
      response.setHeader('Content-Type', `${fielType[suffix] || 'text/html'};charset=utf-8`)
      let content
      try {
        content = fs.readFileSync(`./public${filePath}`)
      } catch(error) {
        content = '文件不存在'
        response.statusCode = 404
      }
      response.write(content)
      response.end()
    }
    

    /******** 代码结束，下面不要看 ************/
})

server.listen(port)
console.log('监听 ' + port + ' 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:' + port)