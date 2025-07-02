import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
import warnings
warnings.filterwarnings("ignore")
import os
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
file_path = os.path.join(BASE_DIR, 'dataset', 'heart_disease_data.csv')
heart_data = pd.read_csv(file_path)

X = heart_data.drop(columns='target', axis=1)
Y = heart_data['target']
X_train, _, Y_train, _ = train_test_split(X, Y, test_size=0.2, stratify=Y, random_state=2)
model = LogisticRegression(max_iter=2000)
model.fit(X_train, Y_train)

def predict_heart_disease(input_data):
    input_np = np.asarray(input_data).reshape(1, -1)
    prediction = model.predict(input_np)
    return bool(prediction[0])
