const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;

// ================================
// HTTP SERVER
// ================================

const server = http.createServer((req, res) => {
    res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
    });

    res.end(`
        <!DOCTYPE html>
        <html lang="fa" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>Anghezi Chat Server</title>
        </head>
        <body>
            <h1>⚽ سرور چت انقزی فعال است</h1>
            <p>Anghezi Chat WebSocket Server</p>
            <p>🟢 Server Online</p>
        </body>
        </html>
    `);
});


// ================================
// WEBSOCKET SERVER
// ================================

const wss = new WebSocket.Server({
    server: server
});


// ================================
// USERS
// ================================

const users = new Map();


// ================================
// SEND TO ALL USERS
// ================================

function sendToAll(data) {

    const message = JSON.stringify(data);

    wss.clients.forEach((client) => {

        if (client.readyState === WebSocket.OPEN) {

            try {
                client.send(message);
            } catch (error) {
                console.log(
                    "❌ Send error:",
                    error.message
                );
            }

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
// WEBSOCKET CONNECTION
// ================================

wss.on("connection", (socket, request) => {

    let username = "کاربر";

    console.log(
        "🟢 WebSocket connected:",
        request.socket.remoteAddress
    );


    // خوش آمدگویی
    socket.send(JSON.stringify({
        type: "system",
        message: "به چت آنلاین انقزی خوش آمدید! ⚽"
    }));


    // تعداد کاربران
    sendOnlineCount();


    // ================================
    // RECEIVE MESSAGE
    // ================================

    socket.on("message", (raw) => {

        try {

            const textData = raw.toString();

            const data = JSON.parse(textData);


            // ============================
            // JOIN
            // ============================

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


            // ============================
            // CHAT MESSAGE
            // ============================

            if (data.type === "message") {

                const message =
                    String(
                        data.message || ""
                    )
                    .trim()
                    .substring(0, 500);


                if (!message) {
                    return;
                }


                console.log(
                    `💬 ${username}: ${message}`
                );


                sendToAll({

                    type: "message",

                    username:
                        username,

                    message:
                        message,

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


    // ================================
    // DISCONNECT
    // ================================

    socket.on("close", () => {

        const oldUsername =
            username;


        users.delete(socket);


        console.log(
            `🔴 ${oldUsername} disconnected`
        );


        sendToAll({
            type: "system",
            message:
                `🔴 ${oldUsername} از چت خارج شد`
        });


        sendOnlineCount();

    });


    // ================================
    // ERROR
    // ================================

    socket.on("error", (error) => {

        console.log(
            "❌ WebSocket Error:",
            error.message
        );

    });

});


// ================================
// KEEP CONNECTION ALIVE
// ================================

const heartbeat =
    setInterval(() => {

        wss.clients.forEach((socket) => {

            if (
                socket.readyState ===
                WebSocket.OPEN
            ) {

                try {

                    socket.ping();

                } catch (error) {

                    console.log(
                        "❌ Ping error:",
                        error.message
                    );

                }

            }

        });

    }, 25000);


// ================================
// SERVER START
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
        "🔌 WEBSOCKET: ENABLED"
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
