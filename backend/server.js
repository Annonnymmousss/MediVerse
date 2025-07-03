import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import http from 'http'
import { startSocketServer } from './socket-server.js' 

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
import DPRoute from './routes/diseasePredictionRoute.js'
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
app.use('/api/predict' , DPRoute)
app.get('/',(req,res)=>{
    res.send('helolo')
})


const server = http.createServer(app); // wrap Express with HTTP server
startSocketServer(server); // attach Socket.IO

server.listen(PORT, () => {
  console.log(`Express + Socket.io server started on http://localhost:${PORT}`);
});
