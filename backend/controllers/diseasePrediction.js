import axios from 'axios';
const heart_prediction = async(req,res)=>{
    try {
    const response = await axios.post('http://127.0.0.1:5000/predict/heart', {
      features: req.body.features
    });

    res.json(response.data);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to get prediction" });
  }
}

const diabetes_prediction = async(req,res)=>{
    try {
    const response = await axios.post('http://127.0.0.1:5000/predict/diabetes', {
      features: req.body.features
    });

    res.json(response.data);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to get prediction" });
  }
}

export {
    heart_prediction , diabetes_prediction
}