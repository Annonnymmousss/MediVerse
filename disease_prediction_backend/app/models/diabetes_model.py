import numpy as np
import pandas as pd
from sklearn import svm
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import warnings
import os
warnings.filterwarnings("ignore")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
file_path = os.path.join(BASE_DIR, 'dataset', 'diabetes.csv')
data = pd.read_csv(file_path)

X = data.drop(columns='Outcome', axis=1)
Y = data['Outcome']
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
X_train, _, Y_train, _ = train_test_split(X_scaled, Y, test_size=0.2, stratify=Y, random_state=2)
model = svm.SVC(kernel='linear')
model.fit(X_train, Y_train)

def predict_diabetes(input_data):
    input_array = np.asarray(input_data).reshape(1, -1)
    input_scaled = scaler.transform(input_array)
    prediction = model.predict(input_scaled)
    return bool(prediction[0])
