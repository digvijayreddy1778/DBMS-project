import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import precision_score, recall_score, f1_score, confusion_matrix
from sqlalchemy import create_engine
import joblib

# ---------------------------------------------------------
# 1. Connect to PostgreSQL and Load Data
# ---------------------------------------------------------
print("Connecting to PostgreSQL...")
engine = create_engine('postgresql+psycopg2://postgres:user%401234@localhost:5432/educompass')

query = """
    SELECT institute, program, category, gender, crank 
    FROM josaa_cutoffs
"""
df = pd.read_sql(query, engine)
df['gender'] = df['gender'].fillna('Gender-Neutral')

print("Aggregating historical data to establish stable thresholds...")
df_stable = df.groupby(['institute', 'program', 'category', 'gender'])['crank'].median().reset_index()

# ---------------------------------------------------------
# 2. Vectorized Dataset Expansion
# ---------------------------------------------------------
print("Expanding dataset with synthetic applicants...")
# Duplicate the dataset 15 times to simulate 15 applicants per course
df_expanded = pd.concat([df_stable] * 15, ignore_index=True)

np.random.seed(42)
# Apply a +/- 15% random noise to the median cutoff to generate realistic applicant ranks
noise = np.random.uniform(-0.15, 0.15, size=len(df_expanded))
df_expanded['applicant_rank'] = (df_expanded['crank'] * (1 + noise)).astype(int)

# Create the binary target label
df_expanded['admission_likely'] = (df_expanded['applicant_rank'] <= df_expanded['crank']).astype(int)

# ---------------------------------------------------------
# 3. Feature Encoding
# ---------------------------------------------------------
print("Encoding categories...")
encoder_dict = {}
for col in ['institute', 'program', 'category', 'gender']:
    df_expanded[col] = df_expanded[col].astype(str) 
    le = LabelEncoder()
    df_expanded[col + '_encoded'] = le.fit_transform(df_expanded[col])
    encoder_dict[col] = le

features = ['institute_encoded', 'program_encoded', 'category_encoded', 'gender_encoded', 'applicant_rank']
X = df_expanded[features]
y = df_expanded['admission_likely']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# ---------------------------------------------------------
# 4. Model Training
# ---------------------------------------------------------
print(f"Training Random Forest on {len(X_train)} applicant records...")

# n_jobs=-1 uses all CPU cores to drastically speed up training
rf_params = {
    'n_estimators': 100,
    'max_depth': None,
    'min_samples_split': 2,
    'random_state': 42,
    'class_weight': 'balanced',
    'n_jobs': -1 
}

model = RandomForestClassifier(**rf_params)
model.fit(X_train, y_train)

# ---------------------------------------------------------
# 5. Evaluation
# ---------------------------------------------------------
y_pred = model.predict(X_test)
print("\n--- Model Evaluation ---")
print(f"Precision: {precision_score(y_test, y_pred):.4f}")
print(f"Recall: {recall_score(y_test, y_pred):.4f}")
print(f"F1 Score: {f1_score(y_test, y_pred):.4f}")

# ---------------------------------------------------------
# 6. Save the Model
# ---------------------------------------------------------
print("\nSaving model and encoders to disk...")
joblib.dump(model, 'educompass_rf_model.pkl')
joblib.dump(encoder_dict, 'label_encoders.pkl')
print("Saved! Ready for Express.js integration.")