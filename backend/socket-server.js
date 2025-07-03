import dotenv from 'dotenv'
import { Server } from 'socket.io'
import path from 'path'
import { fileURLToPath } from 'url'


const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


dotenv.config({ path: path.join(__dirname, '.env') })

export const startSocketServer = (server) => {
    const io = new Server(server ,  {
    cors: {
        origin: [process.env.USER_FRONTEND, process.env.DOC_FRONTEND],
        methods: ["GET", "POST"],
        credentials: true
    }
    })
    const emailToSocketIdMap = new Map();
    const socketidToEmailMap = new Map();

    io.on("connection", (socket) =>{
        console.log(`Socket connected`, socket.id)
        socket.on("room:join", (data) => {
        const { email, room } = data;
        emailToSocketIdMap.set(email, socket.id);
        socketidToEmailMap.set(socket.id, email);
        socket.join(room);
        socket.to(room).emit("user:joined", { email, id: socket.id }); 
        io.to(socket.id).emit("room:join", data);
        console.log(data)
    });

    socket.on("user:call", ({ to, offer }) => {
        
        console.log("Forwarding call offer to:", to);
        socket.to(to).emit("incomming:call", { from: socket.id, offer });
    })
    
    socket.on("call:accepted", ({ to, ans }) => {
        io.to(to).emit("call:accepted", { from: socket.id, ans });
    });

    socket.on("peer:nego:needed", ({ to, offer }) => {
        console.log("peer:nego:needed", offer);
        io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
    })

    socket.on("peer:nego:done", ({ to, ans }) => {
        console.log("peer:nego:done", ans);
        io.to(to).emit("peer:nego:final", { from: socket.id, ans });
    });
    })
}