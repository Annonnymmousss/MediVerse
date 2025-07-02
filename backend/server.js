import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


dotenv.config({ path: path.join(__dirname, '.env') })

import express from 'express'
import cors from 'cors'

// Debug: Check if GEMINI_API_KEY is loaded
console.log('Server.js - GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET');
console.log('Server.js - GEMINI_API_KEY length:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);

import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import adminRoute from './routes/adminRoute.js'
import doctorRouter from './routes/doctorRoute.js'
import userRouter from './routes/userRoute.js'
import aiRouter from './routes/aiRoute.js'
import { Socket } from 'dgram'

const app = express()
const PORT = process.env.PORT||3000
connectDB()
connectCloudinary()

app.use(express.json())
app.use(cors())

app.use('/api/admin' , adminRoute)
app.use('/api/doctor' , doctorRouter)
app.use('/api/user' , userRouter)
app.use('/api/ai' , aiRouter)
app.get('/',(req,res)=>{
    res.send('helolo')
})

app.listen(PORT , ()=>console.log('server started'))



//Socket.io server

import { Server } from 'socket.io'
const io = new Server(8001,  {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
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
    socket.to(room).emit("user:joined", { email, id: socket.id });
    socket.join(room);
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
