import axios from 'axios';
const heart_prediction = async(req,res)=>{
    try {
    const response = await axios.post('https://mediverse-1.onrender.com/predict/heart', {
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
    const response = await axios.post('https://mediverse-1.onrender.com/predict/diabetes', {
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