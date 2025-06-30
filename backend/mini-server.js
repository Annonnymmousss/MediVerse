import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const genAI = new GoogleGenerativeAI('AIzaSyDxEp_of3_BVxzcIAOIo7Q4DM96Vh2lO-s');

app.get('/test', async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const result = await model.generateContent('Hello, this is a test message.');
    const response = await result.response;
    res.send(response.text());
  } catch (e) {
    res.status(500).send(e.message);
  }
});

app.listen(4000, () => console.log('Mini server running on 4000'));