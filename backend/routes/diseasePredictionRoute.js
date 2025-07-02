import express from 'express'
import { diabetes_prediction, heart_prediction } from '../controllers/diseasePrediction.js'
const DPRoute = express.Router()


DPRoute.post('/heart' , heart_prediction)
DPRoute.post('/diabetes' , diabetes_prediction)

export default DPRoute;