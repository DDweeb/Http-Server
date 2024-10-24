const net = require("net");
const fs = require("fs");
const zlib = require('zlib');

console.log("Logs from your program will appear here!");

const server = net.createServer(async (socket) => {
  socket.on("data", (data) => {
    const request = data.toString();
    const headers = request.split('\r\n');
    if (request.startsWith('GET / ')) {
      const httpresponse = 'HTTP/1.1 200 OK\r\n\r\n';
      socket.write(httpresponse);
    }

    else if (request.includes("/echo/")) {
      const acceptEncoding = headers[2].split('Accept-Encoding: ')[1] || '';
      const content = request.match(/\/echo\/([^\/\s]+)/)?.[1] || '';
      const bodyEncoded = zlib.gzipSync(content);
      const bodyEncodedLength = bodyEncoded.length;
      if (acceptEncoding.includes("gzip")) {
        return socket.write(
          `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Encoding: gzip\r\nContent-Length: ${bodyEncodedLength}\r\n\r\n`
        ) + socket.write(bodyEncoded);
      }
      socket.write(
        `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${content.length}\r\n\r\n${content}`
      );
    }

    else if (request.includes("/user-agent")) {
      const userAgent = headers[2].split('User-Agent: ')[1];
      socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`);
    }

    else if (request.includes("/files")) {
      const directory = process.argv[3];
      const filename = request.slice(request.indexOf('/files/') + '/files/'.length, request.indexOf(' ', request.indexOf('/files/') + 1));
      if (request.startsWith('GET /')) {
        if (fs.existsSync(`${directory}/${filename}`)) {
          const content = fs.readFileSync(`${directory}/${filename}`).toString();
          const res = `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${content.length}\r\n\r\n${content}\r\n`;
          socket.write(res);
        } else {
          socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
        }
      } else if (request.startsWith("POST /")) {
        const req = data.toString().split("\r\n");
        const body = req[req.length - 1];
        const file = `${directory}/${filename}`;
        fs.writeFileSync(file, body);
        socket.write(`HTTP/1.1 201 Created\r\n\r\n`);
      }
    }

    else {
      const httpresponse = 'HTTP/1.1 404 Not Found\r\n\r\n';
      socket.write(httpresponse);
    }
    socket.end();
  });
});


server.listen(4221, "localhost");

