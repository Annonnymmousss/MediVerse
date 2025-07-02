// backend/utils/aiHelpers.js
import { GoogleGenerativeAI } from '@google/generative-ai';

import Tesseract from 'tesseract.js';


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


const calculateAge = (dob) => {
    if (!dob || dob === 'not selected') return 'Unknown';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};


const generateContent = async (prompt, model = 'gemini-1.5-pro') => {
    try {
      
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not set in environment variables');
        }
        
        console.log('Attempting to generate content with model:', model);
        console.log('GEMINI_API_KEY available:', process.env.GEMINI_API_KEY ? 'YES' : 'NO');
        console.log('GEMINI_API_KEY length:', process.env.GEMINI_API_KEY.length);
        console.log('GEMINI_API_KEY starts with:', process.env.GEMINI_API_KEY.substring(0, 10) + '...');
        console.log('GEMINI_API_KEY ends with:', '...' + process.env.GEMINI_API_KEY.substring(process.env.GEMINI_API_KEY.length - 10));
        
        const geminiModel = genAI.getGenerativeModel({ model });
        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Error generating content with Gemini:', error);
        console.error('Error details:', {
            message: error.message,
            status: error.status,
            statusText: error.statusText,
            errorDetails: error.errorDetails
        });
        console.error('Prompt was:', prompt.substring(0, 100) + '...');
        throw error;
    }
};


const generateAgent1Greeting = async (user, appointment) => {
    const prompt = `You are a friendly medical assistant. Greet the patient ${user.name} and ask if this is a new problem or ongoing treatment. 
    
    Patient History:
    - Age: ${calculateAge(user.dob)}
    - Gender: ${user.gender}
    - Chronic Conditions: ${user.medicalHistory?.chronicConditions?.join(', ') || 'None'}
    - Allergies: ${user.medicalHistory?.allergies?.join(', ') || 'None'}
    - Current Medications: ${user.medicalHistory?.currentMedications?.join(', ') || 'None'}
    
    Doctor: ${appointment.docData.name} (${appointment.docData.speciality})
    Appointment Date: ${appointment.slotDate}
    
    Be warm and professional. Ask about their current symptoms. Keep your response under 100 words.`;
    
    try {
        const content = await generateContent(prompt);
        return content;
    } catch (error) {
        console.error('Error generating greeting:', error);
        return `Hello ${user.name}! I'm here to help gather some information before your appointment with Dr. ${appointment.docData.name}. Is this a new problem or ongoing treatment?`;
    }
};


const generateAgent1Response = async (aiSession, userMessage) => {
    const conversationHistory = aiSession.messages.map(msg => 
        `${msg.role}: ${msg.content}`
    ).join('\n');
    
    const prompt = `You are a medical triage assistant. Your role is to:
    1. Collect symptom information safely
    2. Assess urgency (1-10 scale)
    3. Provide gentle, safe advice
    4. NEVER give definitive diagnoses
    5. Always recommend consulting a doctor for serious symptoms
    6. Ask follow-up questions to gather complete information
    
    Current conversation:
    ${conversationHistory}
    
    User: ${userMessage}
    
    Respond appropriately and collect structured symptom data. If you have enough information, provide a care plan. Keep responses under 150 words.`;
    
    try {
        const content = await generateContent(prompt);
        
   
        const symptoms = extractSymptoms(userMessage);
     
        const isComplete = checkIfComplete(conversationHistory + '\nUser: ' + userMessage);
        
        return {
            content,
            symptoms,
            isComplete
        };
    } catch (error) {
        console.error('Error generating response:', error);
        return {
            content: "I'm having trouble processing your message. Please try again or contact your doctor directly for urgent concerns.",
            symptoms: {},
            isComplete: false
        };
    }
};


const extractSymptoms = (message) => {
    const symptoms = {};

    const durationMatch = message.match(/(\d+)\s*(day|week|month|year)s?/i);
    if (durationMatch) {
        symptoms.duration = `${durationMatch[1]} ${durationMatch[2]}${durationMatch[1] > 1 ? 's' : ''}`;
    }
    

    const severityMatch = message.match(/(?:pain|symptom|discomfort)\s*(?:level|scale|is)?\s*(\d+)/i);
    if (severityMatch) {
        symptoms.severity = parseInt(severityMatch[1]);
    }

    symptoms.description = message;
    

    const redFlags = [];
    const redFlagKeywords = [
        'chest pain', 'shortness of breath', 'severe pain', 'unconscious', 
        'bleeding', 'head injury', 'stroke', 'heart attack', 'emergency'
    ];
    
    redFlagKeywords.forEach(keyword => {
        if (message.toLowerCase().includes(keyword)) {
            redFlags.push(keyword);
        }
    });
    
    if (redFlags.length > 0) {
        symptoms.redFlags = redFlags;
    }
    
    return symptoms;
};


const checkIfComplete = (conversation) => {
    const mustHave = [
   
        'symptom', 'problem', 'issue', 'condition',
       
        'duration', 'how long', 'when',
     
        'severity', 'pain', 'scale',

        'where', 'location', 'area',
    
        'start', 'onset', 'began', 'since'
    ];
   
    return mustHave.every(info => conversation.toLowerCase().includes(info));
};


const generateAgent1Summary = async (aiSession) => {
    const conversation = aiSession.messages.map(msg => 
        `${msg.role}: ${msg.content}`
    ).join('\n');
    
    const prompt = `Based on the following conversation, create a structured summary:

    Conversation:
    ${conversation}

    Create a JSON response with:
    {
        "carePlan": ["item1", "item2", "item3"],
        "recommendations": ["rec1", "rec2"],
        "urgency": "low/medium/high"
    }

    Focus on safe, general advice like rest, hydration, monitoring symptoms. Set urgency based on red flags.`;

    try {
        console.log('Agent1Summary Prompt:', prompt.substring(0, 500));
        const content = await generateContent(prompt);
        console.log('Agent1Summary Gemini Response:', content.substring(0, 500));
    
        try {
     
            return JSON.parse(content);
        } catch (parseError) {
         
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    return JSON.parse(jsonMatch[0]);
                } catch (jsonErr) {
                    console.error('Agent1Summary JSON extraction failed:', jsonErr);
                }
            }
           
            console.error('Agent1Summary parse error:', parseError);
            console.error('Agent1Summary raw response:', content);
       
            return {
                carePlan: ["Rest and monitor symptoms", "Stay hydrated", "Contact doctor if symptoms worsen"],
                recommendations: ["Follow up with doctor as scheduled"],
                urgency: "low"
            };
        }
    } catch (error) {
        console.error('Error generating summary:', error);
        return {
            carePlan: ["Rest and monitor symptoms", "Stay hydrated", "Contact doctor if symptoms worsen"],
            recommendations: ["Follow up with doctor as scheduled"],
            urgency: "low"
        };
    }
};


const generateAgent2Diagnosis = async (aiSession, appointment) => {
    const prompt = `You are a medical diagnostic assistant. Analyze the following patient data and provide a structured JSON response with:
    1. summary: Key findings in 1-2 sentences
    2. differentialDiagnosis: Array of objects [{condition, confidence, reasoning}]
    3. recommendedTests: Array of test names
    4. specialistReferrals: Array of specialist types (if any)

    Patient Data:
    ${JSON.stringify(aiSession.symptoms)}
    ${JSON.stringify(aiSession.agent1Summary)}

    Doctor: ${appointment.docData.name} (${appointment.docData.speciality})

    Example JSON:
    {
      "summary": "Patient presents with chest pain and shortness of breath. High risk for cardiac event.",
      "differentialDiagnosis": [
        {"condition": "Acute coronary syndrome", "confidence": 0.8, "reasoning": "Severe chest pain, high urgency"},
        {"condition": "Panic attack", "confidence": 0.2, "reasoning": "No cardiac history, anxiety present"}
      ],
      "recommendedTests": ["ECG", "Troponin", "Chest X-ray"],
      "specialistReferrals": ["Cardiologist"]
    }
    Respond ONLY with valid JSON.`;

    try {
        console.log('Agent2Diagnosis Prompt:', prompt.substring(0, 500));
        const content = await generateContent(prompt);
        console.log('Agent2Diagnosis Gemini Response:', content.substring(0, 500));
  
        try {
            return JSON.parse(content);
        } catch (parseError) {

            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    return JSON.parse(jsonMatch[0]);
                } catch (jsonErr) {
                    console.error('Agent2Diagnosis JSON extraction failed:', jsonErr);
                }
            }
       
            console.error('Agent2Diagnosis parse error:', parseError);
            console.error('Agent2Diagnosis raw response:', content);
      
            return {
                summary: "Requires medical evaluation.",
                differentialDiagnosis: [
                    {
                        condition: "Requires medical evaluation",
                        confidence: 0.7,
                        reasoning: "Professional assessment needed"
                    }
                ],
                recommendedTests: ["Basic examination"],
                specialistReferrals: []
            };
        }
    } catch (error) {
        console.error('Error generating diagnosis:', error);
        return {
            summary: "Requires medical evaluation.",
            differentialDiagnosis: [
                {
                    condition: "Requires medical evaluation",
                    confidence: 0.7,
                    reasoning: "Professional assessment needed"
                }
            ],
            recommendedTests: ["Basic examination"],
            specialistReferrals: []
        };
    }
};


const generateAgent3Analysis = async (extractedText) => {
    const prompt = `You are a medical report analyst. Analyze the following test results and provide:
    1. Summary of abnormalities
    2. Highlight out-of-range values
    3. Suggest specialist review if needed
    
    Test Report:
    ${extractedText}
    
    Provide a structured analysis in JSON format:
    {
        "summary": "brief summary",
        "abnormalities": ["abnormality1", "abnormality2"],
        "recommendations": ["rec1", "rec2"]
    }`;

    try {
    
        const content = await generateContent(prompt, 'gemini-2.5-pro');
        console.log(content);
        
        return parseAgent3Response(content);
    } catch (error) {
        console.error('Error analyzing report:', error);
        return {
            summary: "Report analysis completed",
            abnormalities: [],
            recommendations: ["Review with healthcare provider"]
        };
    }
};


const parseAgent3Response = (content) => {
    try {

        return JSON.parse(content);
    } catch (parseError) {
  
        const jsonMatch = content.match(/```json\s*([\s\S]*?)```/i) || content.match(/```\s*([\s\S]*?)```/i);
        if (jsonMatch && jsonMatch[1]) {
            try {
                return JSON.parse(jsonMatch[1]);
            } catch (jsonErr) {
                console.error('Agent3 JSON extraction failed:', jsonErr);
            }
        }
      
        const fallbackJson = content.match(/\{[\s\S]*\}/);
        if (fallbackJson) {
            try {
                return JSON.parse(fallbackJson[0]);
            } catch (jsonErr) {
                console.error('Agent3 fallback JSON extraction failed:', jsonErr);
            }
        }
       
        return {
            summary: content.substring(0, 200) + "...",
            abnormalities: [],
            recommendations: ["Review with healthcare provider"]
        };
    }
};


const extractTextFromReport = async (fileUrl) => {
    const { data: { text } } = await Tesseract.recognize(fileUrl, 'eng');
    console.log(text);
        
    return text;
};

export {
    generateAgent1Greeting,
    generateAgent1Response,
    generateAgent1Summary,
    generateAgent2Diagnosis,
    generateAgent3Analysis,
    extractTextFromReport,
    calculateAge
};