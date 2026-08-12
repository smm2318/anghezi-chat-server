const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;

// ================================
// HTTP SERVER
// ================================

const server = http.createServer((req, res) => {
    res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8"
    });

    res.end(`
        <!DOCTYPE html>
        <html lang="fa" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>سرور چت انقزی</title>
        </head>
        <body>
            <h1>⚽ سرور چت انقزی فعال است</h1>
            <p>Anghezi Chat WebSocket Server</p>
        </body>
        </html>
    `);
});


// ================================
// WEBSOCKET SERVER
// ================================

const wss = new WebSocket.Server({
    noServer: true
});


// ================================
// WEBSOCKET PATH
// ================================

server.on("upgrade", (request, socket, head) => {

    const url = new URL(
        request.url,
        `http://${request.headers.host}`
    );

    if (url.pathname !== "/ws") {

        socket.write(
            "HTTP/1.1 404 Not Found\r\n\r\n"
        );

        socket.destroy();

        return;
    }

    wss.handleUpgrade(
        request,
        socket,
        head,
        (ws) => {
            wss.emit(
                "connection",
                ws,
                request
            );
        }
    );
});


// ================================
// USERS
// ================================

const users = new Map();


// ================================
// BROADCAST
// ================================

function sendToAll(data) {

    const message = JSON.stringify(data);

    wss.clients.forEach((client) => {

        if (client.readyState === WebSocket.OPEN) {

            client.send(message);

        }

    });
}


// ================================
// ONLINE COUNT
// ================================

function sendOnlineCount() {

    sendToAll({
        type: "online",
        count: wss.clients.size
    });

}


// ================================
// CONNECTION
// ================================

wss.on("connection", (socket, request) => {

    let username = "کاربر";

    console.log(
        "🟢 WebSocket connected:",
        request.socket.remoteAddress
    );


    socket.send(JSON.stringify({
        type: "system",
        message: "به چت آنلاین انقزی خوش آمدید! ⚽"
    }));


    sendOnlineCount();


    // ============================
    // MESSAGE
    // ============================

    socket.on("message", (raw) => {

        try {

            const data =
                JSON.parse(raw.toString());


            // JOIN
            if (data.type === "join") {

                username =
                    String(
                        data.username || "کاربر"
                    )
                    .trim()
                    .substring(0, 20);

                if (!username) {
                    username = "کاربر";
                }

                users.set(
                    socket,
                    username
                );

                console.log(
                    `👤 ${username} joined`
                );

                sendToAll({
                    type: "system",
                    message:
                        `🟢 ${username} وارد چت شد`
                });

                sendOnlineCount();

                return;
            }


            // CHAT MESSAGE
            if (data.type === "message") {

                const text =
                    String(
                        data.message || ""
                    )
                    .trim()
                    .substring(0, 500);

                if (!text) {
                    return;
                }

                console.log(
                    `💬 ${username}: ${text}`
                );

                sendToAll({

                    type: "message",

                    username:
                        username,

                    message:
                        text,

                    time:
                        new Date()
                        .toLocaleTimeString(
                            "fa-IR",
                            {
                                hour: "2-digit",
                                minute: "2-digit"
                            }
                        )

                });

            }

        } catch (error) {

            console.log(
                "❌ Message error:",
                error.message
            );

        }

    });


    // ============================
    // CLOSE
    // ============================

    socket.on("close", () => {

        users.delete(socket);

        console.log(
            `🔴 ${username} disconnected`
        );

        sendToAll({
            type: "system",
            message:
                `🔴 ${username} از چت خارج شد`
        });

        sendOnlineCount();

    });


    // ============================
    // ERROR
    // ============================

    socket.on("error", (error) => {

        console.log(
            "❌ WebSocket Error:",
            error.message
        );

    });

});


// ================================
// KEEP ALIVE
// ================================

const heartbeat = setInterval(() => {

    wss.clients.forEach((socket) => {

        if (socket.readyState === WebSocket.OPEN) {

            socket.ping();

        }

    });

}, 25000);


// ================================
// START SERVER
// ================================

server.listen(PORT, () => {

    console.log(
        "================================"
    );

    console.log(
        "🚀 ANGHEZI CHAT SERVER"
    );

    console.log(
        `🌐 HTTP PORT: ${PORT}`
    );

    console.log(
        "🔌 WEBSOCKET PATH: /ws"
    );

    console.log(
        "💚 SERVER IS READY"
    );

    console.log(
        "================================"
    );

});


// ================================
// SHUTDOWN
// ================================

process.on("SIGTERM", () => {

    clearInterval(heartbeat);

    server.close(() => {

        console.log(
            "🛑 Server stopped"
        );

        process.exit(0);

    });

});
