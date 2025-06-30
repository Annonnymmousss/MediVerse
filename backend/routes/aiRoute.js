// backend/routes/aiRoute.js
import express from 'express';
import { 
    startAgent1Session, 
    processAgent1Message, 
    getAISession, 
    generateAgent2Analysis, 
    analyzeTestReport,
    getAppointmentDetails,
    forceCompleteAgent1Session
} from '../controllers/aiSessionController.js';
import authUser from '../middlwares/authUser.js';
import authDoctor from '../middlwares/authDoctor.js';
import upload from '../middlwares/multer.js';

const aiRouter = express.Router();


aiRouter.post('/start-session', authUser, startAgent1Session);
aiRouter.post('/process-message', authUser, processAgent1Message);
aiRouter.get('/session/:sessionId', authUser, getAISession);
aiRouter.get('/appointment/:appointmentId', authUser, getAppointmentDetails);
aiRouter.post('/complete-session', authUser, forceCompleteAgent1Session);


aiRouter.post('/generate-analysis', authDoctor, generateAgent2Analysis);


aiRouter.post('/analyze-report', authUser, upload.array('reports', 5), analyzeTestReport);

export default aiRouter;