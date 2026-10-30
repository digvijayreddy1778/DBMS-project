import sys
import json
import pandas as pd
import joblib

def main():
    try:
        # 1. Parse inputs passed from Node.js
        input_data = json.loads(sys.argv[1])
        institute = str(input_data['institute'])
        program = str(input_data['program'])
        category = str(input_data['category'])
        gender = str(input_data['gender'])
        rank = int(input_data['rank'])

        # 2. Load the trained model and encoders
        # Ensure these paths point to where your .pkl files are saved
        model = joblib.load('educompass_rf_model.pkl')
        encoders = joblib.load('label_encoders.pkl')

        # 3. Encode the categorical inputs
        inst_enc = encoders['institute'].transform([institute])[0]
        prog_enc = encoders['program'].transform([program])[0]
        cat_enc = encoders['category'].transform([category])[0]
        gen_enc = encoders['gender'].transform([gender])[0]

        # 4. Format features exactly as the model expects
        features = ['institute_encoded', 'program_encoded', 'category_encoded', 'gender_encoded', 'applicant_rank']
        X_input = pd.DataFrame([[inst_enc, prog_enc, cat_enc, gen_enc, rank]], columns=features)

        # 5. Predict the probability of class 1 (Admission Likely)
        probability = model.predict_proba(X_input)[0][1]
        
        # 6. Output the result to stdout for Node.js to capture
        print(json.dumps({
            "success": True, 
            "probability": round(probability * 100, 2)
        }))

    except ValueError as e:
        # Handles unseen categories (e.g., if a user searches for an institute not in the DB)
        print(json.dumps({"success": False, "error": f"Unrecognized category or institute: {str(e)}"}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    main()