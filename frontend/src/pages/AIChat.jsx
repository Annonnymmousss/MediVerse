// frontend/src/pages/AIChat.jsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const AIChat = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { token, backendUrl } = useContext(AppContext);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [sessionData, setSessionData] = useState(null);
    const [agent2Loading, setAgent2Loading] = useState(false);
    const [agent2Analysis, setAgent2Analysis] = useState(null);
    const messagesEndRef = useRef(null);
    const [endingAssessment, setEndingAssessment] = useState(false);


    const [testResults, setTestResults] = useState({ diabetes: null, heart: null });
    const [showTestModal, setShowTestModal] = useState(false);
    const [testType, setTestType] = useState("diabetes"); 
    const [formData, setFormData] = useState({});
    const [testResult, setTestResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const toggleTestType = () => {
    setTestType(prev => (prev === "diabetes" ? "heart" : "diabetes"));
    setFormData({});
    setTestResult(null);
    };

    const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
    setLoading(true);
    try {
        const fields =
        testType === "diabetes"
            ? ["pregnancies", "glucose", "blood_pressure", "skin_thickness", "insulin", "bmi", "diabetes_pedigree_function", "age"]
            : ["age", "sex", "cp", "trestbps", "chol", "fbs", "restecg", "thalach", "exang", "oldpeak", "slope", "ca", "thal"];

        const features = fields.map((field) => parseFloat(formData[field]) || 0);

        const res = await fetch(`${backendUrl}/api/predict/${testType}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ features })
        });

        const data = await res.json();
        console.log(`${testType}:`, data.is_diabetic ?? data.has_disease);

        const resultMessage = data.is_diabetic !== undefined
        ? `${testType}: ${data.is_diabetic}`
        : data.has_disease !== undefined
        ? `${testType} disease : ${data.has_disease}`
        : "Analysis complete";

        setTestResult(resultMessage);
        toast.success(resultMessage);
    } catch (err) {
        console.error(err);
        setTestResult("Something went wrong.");
    }
    setLoading(false);
    };


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (!token) {
            toast.error("Please login to access this page");
            navigate('/login');
            return;
        }
        fetchSessionData();
    }, [sessionId, token]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchSessionData = async () => {
        try {
            const response = await axios.get(`${backendUrl}/api/ai/session/${sessionId}`, {
                headers: { token }
            });
            if (response.data.success) {
                setSessionData(response.data.session);
                setMessages(response.data.session.messages || []);
                setIsComplete(response.data.session.status === 'completed');
            }
        } catch (error) {
            console.error('Error fetching session:', error);
            toast.error('Failed to load chat session');
        }
    };

    const sendMessage = async () => {
        if (!inputMessage.trim() || isLoading || isComplete) return;

        const userMessage = inputMessage;
        setInputMessage('');
        setIsLoading(true);


        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

        try {
            const response = await axios.post(`${backendUrl}/api/ai/process-message`, {
                sessionId,
                message: userMessage
            }, {
                headers: { token }
            });

            if (response.data.success) {
                setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
                
                if (response.data.isComplete) {
                    setIsComplete(true);
                    toast.success('Pre-appointment assessment completed!');
                }
            } else {
                toast.error(response.data.message || 'Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleAgent2Followup = async () => {
        if (!sessionData?.appointment?._id) return;
        setAgent2Loading(true);
        setAgent2Analysis(null);
        try {
            const res = await axios.post(
                `${backendUrl}/api/ai/generate-analysis`,
                { appointmentId: sessionData.appointment._id },
                { headers: { token } }
            );
            if (res.data.success) {
                setAgent2Analysis(res.data.analysis);
            } else {
                toast.error(res.data.message || 'Failed to get Agent 2 analysis');
            }
        } catch (error) {
            toast.error('Failed to get Agent 2 analysis');
        } finally {
            setAgent2Loading(false);
        }
    };

    const endAssessment = async () => {
        setEndingAssessment(true);
        try {
            const response = await axios.post(
                `${backendUrl}/api/ai/complete-session`,
                { sessionId },
                { headers: { token } }
            );
            if (response.data.success) {
                setIsComplete(true);
                toast.success('Assessment ended and summary generated!');
            } else {
                toast.error(response.data.message || 'Failed to end assessment');
            }
        } catch (error) {
            toast.error('Failed to end assessment');
        } finally {
            setEndingAssessment(false);
        }
    };

    if (!sessionData) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Pre-Appointment Assessment</h1>
                <p className="text-gray-600 mt-2">
                    Let's gather some information about your symptoms before your appointment with{' '}
                    <span className="font-medium">{sessionData.docData?.name}</span>
                </p>
                <p className="text-sm text-gray-500 mt-1">
                    Appointment: {sessionData.appointment?.slotDate} at {sessionData.appointment?.slotTime}
                </p>
            </div>
            
            {/* Chat Interface */}
            <div className="bg-white rounded-lg border border-gray-200 h-96 flex flex-col">
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message, index) => (
                        <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                message.role === 'user' 
                                    ? 'bg-indigo-500 text-white' 
                                    : 'bg-gray-100 text-gray-800'
                            }`}>
                                {message.content}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                
                {/* Input Area */}
                {!isComplete && (
                    <>
                        <div className="border-t border-gray-200 p-4 flex space-x-2">
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type your message..."
                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                disabled={isLoading}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={isLoading || !inputMessage.trim()}
                                className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Send
                            </button>
                        </div>
                        <div className="p-4 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={endAssessment}
                                disabled={endingAssessment}
                                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {endingAssessment ? 'Ending...' : 'End Assessment'}
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Completion Message */}
            {isComplete && (
                <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <p className="text-green-800 font-medium">Assessment completed successfully!</p>
                    </div>
                    <p className="text-green-700 text-sm mt-1">
                        Your doctor will review this information before your appointment.
                    </p>
                    {/* Agent 2 Follow-up Button */}
                    {!agent2Analysis && (
                        <button
                            onClick={handleAgent2Followup}
                            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                            disabled={agent2Loading}
                        >
                            {agent2Loading ? 'Getting Doctor Analysis...' : "Get Doctor's (Agent 2) Analysis"}
                        </button>
                    )}
                    {/* Agent 2 Analysis Display */}
                    {agent2Analysis && (
                        <div className="mt-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
                            <h3 className="font-semibold text-blue-800 mb-2">Doctor's (Agent 2) Analysis</h3>
                            {agent2Analysis.differentialDiagnosis && (
                                <div className="mb-2">
                                    <p className="font-medium text-blue-700 mb-1">Possible Conditions:</p>
                                    <ul className="list-disc list-inside text-blue-900">
                                        {agent2Analysis.differentialDiagnosis.map((diag, idx) => (
                                            <li key={idx}>
                                                <span className="font-semibold">{diag.condition}</span> ({Math.round(diag.confidence * 100)}% confidence)
                                                {diag.reasoning && <span className="block text-xs text-blue-700">{diag.reasoning}</span>}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {agent2Analysis.recommendedTests && agent2Analysis.recommendedTests.length > 0 && (
                                <div className="mb-2">
                                    <p className="font-medium text-blue-700 mb-1">Recommended Tests:</p>
                                    <ul className="list-disc list-inside text-blue-900">
                                        {agent2Analysis.recommendedTests.map((test, idx) => (
                                            <li key={idx}>{test}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {agent2Analysis.specialistReferrals && agent2Analysis.specialistReferrals.length > 0 && (
                                <div className="mb-2">
                                    <p className="font-medium text-blue-700 mb-1">Specialist Referrals:</p>
                                    <ul className="list-disc list-inside text-blue-900">
                                        {agent2Analysis.specialistReferrals.map((ref, idx) => (
                                            <li key={idx}>{ref}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {agent2Analysis.advice && agent2Analysis.advice.length > 0 && (
                                <div className="mb-2">
                                    <p className="font-medium text-blue-700 mb-1">Advice:</p>
                                    <ul className="list-disc list-inside text-blue-900">
                                        {agent2Analysis.advice.map((adv, idx) => (
                                            <li key={idx}>{adv}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-6">
                <button
                    onClick={() => navigate('/my-appointments')}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    Back to Appointments
                </button>
                {sessionData.appointment && (
                    <button
                        onClick={() => navigate(`/upload-reports/${sessionData.appointment._id}`)}
                        className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                        Upload Test Reports
                    </button>
                )}

                {/* Test Button */}
                {!testResult && (
                <button
                    onClick={() => setShowTestModal(true)}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                    Test Diabetes or Heart Disease
                </button>
                )}
                {testResult && (
                <div className="text-sm text-green-700 font-semibold ml-4">
                     {testResult}
                </div>
                
                )}
            </div>
                            {/* Modal */}
                {showTestModal && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-[95%] max-w-2xl overflow-y-auto max-h-[90vh]">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">
                        Test for {testType === "diabetes" ? "Diabetes" : "Heart Disease"}
                        </h2>
                        <button
                        onClick={() => setShowTestModal(false)}
                        className="text-gray-500 hover:text-gray-800 text-lg"
                        >
                        ✖
                        </button>
                    </div>

                    {/* Toggle */}
                    <div className="flex justify-between mb-4">
                        <span className={`font-semibold ${testType === "diabetes" ? "text-blue-600" : "text-gray-400"}`}>Diabetes</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={testType === "heart"}
                            onChange={toggleTestType}
                        />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 transition-all" />
                        <span className="ml-2 text-sm font-medium text-gray-700">Toggle</span>
                        </label>
                        <span className={`font-semibold ${testType === "heart" ? "text-blue-600" : "text-gray-400"}`}>Heart</span>
                    </div>

                    {/* Input Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {testType === "diabetes" ? (
                        <>
                            {["pregnancies", "glucose", "blood_pressure", "skin_thickness", "insulin", "bmi", "diabetes_pedigree_function", "age"].map((field) => (
                            <input
                                key={field}
                                name={field}
                                type="number"
                                step="any"
                                placeholder={field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border rounded"
                            />
                            ))}
                        </>
                        ) : (
                        <>
                            {["age", "sex", "cp", "trestbps", "chol", "fbs", "restecg", "thalach", "exang", "oldpeak", "slope", "ca", "thal"].map((field) => (
                            <input
                                key={field}
                                name={field}
                                type="number"
                                step="any"
                                placeholder={field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border rounded"
                            />
                            ))}
                        </>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="mt-6 flex justify-end">
                        <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-green-500 text-white px-5 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
                        >
                        {loading ? "Testing..." : "Analyse"}
                        </button>
                    </div>
                    </div>
                </div>
                )}

        </div>
        
    );
};

export default AIChat;