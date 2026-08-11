const WebSocket = require("ws");
const http = require("http");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8"
    });

    res.end(`
        <h1>⚽ سرور چت انقزی فعال است</h1>
        <p>Anghezi Chat WebSocket Server</p>
    `);
});

const wss = new WebSocket.Server({ server });

const users = new Map();

function sendToAll(data) {
    const message = JSON.stringify(data);

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

function sendOnlineCount() {
    sendToAll({
        type: "online",
        count: wss.clients.size
    });
}

wss.on("connection", (socket) => {

    let username = "کاربر";

    socket.send(JSON.stringify({
        type: "system",
        message: "به چت آنلاین انقزی خوش آمدید! ⚽"
    }));

    sendOnlineCount();

    socket.on("message", (raw) => {

        try {
            const data = JSON.parse(raw);

            // تعیین نام کاربر
            if (data.type === "join") {

                username =
                    String(data.username || "کاربر")
                    .trim()
                    .substring(0, 20);

                users.set(socket, username);

                sendToAll({
                    type: "system",
                    message: `🟢 ${username} وارد چت شد`
                });

                sendOnlineCount();
                return;
            }

            // پیام چت
            if (data.type === "message") {

                const text =
                    String(data.message || "")
                    .trim()
                    .substring(0, 500);

                if (!text) return;

                sendToAll({
                    type: "message",
                    username: username,
                    message: text,
                    time: new Date().toLocaleTimeString("fa-IR", {
                        hour: "2-digit",
                        minute: "2-digit"
                    })
                });
            }

        } catch (error) {
            console.log("خطای پیام:", error.message);
        }
    });

    socket.on("close", () => {

        users.delete(socket);

        sendToAll({
            type: "system",
            message: `🔴 ${username} از چت خارج شد`
        });

        sendOnlineCount();
    });

    socket.on("error", (error) => {
        console.log("WebSocket Error:", error.message);
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Anghezi Chat Server running on port ${PORT}`);
});
