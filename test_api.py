#!/usr/bin/env python3
"""
Test script for SentinelAI API integration.
Run with: python test_api.py

Prerequisites:
- Backend running on http://localhost:8000
- Run: uvicorn app.main:app --reload
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test 1: Health check endpoint"""
    print("\n" + "="*50)
    print("TEST 1: Health Check")
    print("="*50)

    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"[PASS] Status: {data.get('status')}")
            print(f"       Models loaded: {data.get('models_loaded')}")
            return True
        else:
            print(f"[FAIL] Failed with status: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("[FAIL] Connection failed - Is the backend running?")
        print("   Start with: cd backend && uvicorn app.main:app --reload")
        return False

def test_predict_text_only():
    """Test 2: /predict with text only"""
    print("\n" + "="*50)
    print("TEST 2: Predict - Text Only (SPAM example)")
    print("="*50)

    payload = {
        "text": "URGENT: Your bank account has been compromised! Click here immediately to verify: bit.ly/secure123",
        "metadata": {
            "sender": "+919876543210",
            "url": "bit.ly/secure123",
            "timestamp": "2024-03-24T12:00:00"
        }
    }

    try:
        response = requests.post(f"{BASE_URL}/predict", json=payload, timeout=30)
        if response.status_code == 200:
            data = response.json()
            print(f"[PASS] Decision: {data.get('decision')}")
            print(f"   Final Score: {data.get('final_score'):.4f}")
            print(f"   Confidence: {data.get('confidence')}")
            print(f"   Pipeline Scores: {data.get('pipeline_scores')}")
            print(f"   Contributing Words: {[w['word'] for w in data.get('explainability', {}).get('contributing_words', [])[:3]]}")
            return True
        else:
            print(f"[FAIL] Failed with status: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"[FAIL] Error: {e}")
        return False

def test_predict_ham():
    """Test 3: /predict with HAM example"""
    print("\n" + "="*50)
    print("TEST 3: Predict - Text Only (HAM example)")
    print("="*50)

    payload = {
        "text": "Your OTP is 123456. Valid for 10 minutes. Do not share with anyone. - HDFC Bank",
        "metadata": {
            "sender": "HDFCBK",
            "timestamp": "2024-03-24T12:00:00"
        }
    }

    try:
        response = requests.post(f"{BASE_URL}/predict", json=payload, timeout=30)
        if response.status_code == 200:
            data = response.json()
            print(f"[PASS] Decision: {data.get('decision')}")
            print(f"   Final Score: {data.get('final_score'):.4f}")
            print(f"   Confidence: {data.get('confidence')}")
            return True
        else:
            print(f"[FAIL] Failed with status: {response.status_code}")
            return False
    except Exception as e:
        print(f"[FAIL] Error: {e}")
        return False

def test_response_structure():
    """Test 4: Verify response matches SentinelResponse structure"""
    print("\n" + "="*50)
    print("TEST 4: Verify Response Structure")
    print("="*50)

    payload = {
        "text": "Congratulations! You won Rs 50,000! Claim now at prize-winner.xyz",
        "metadata": {
            "sender": "+917654321098",
            "url": "prize-winner.xyz"
        }
    }

    try:
        response = requests.post(f"{BASE_URL}/predict", json=payload, timeout=30)
        if response.status_code == 200:
            data = response.json()

            # Check required fields
            required_fields = ['final_score', 'decision', 'confidence', 'pipeline_scores', 'explainability', 'fusion_weights_used']
            missing = [f for f in required_fields if f not in data]

            if missing:
                print(f"[FAIL] Missing fields: {missing}")
                return False

            # Check pipeline_scores structure
            ps = data['pipeline_scores']
            ps_fields = ['text', 'metadata', 'image']
            ps_missing = [f for f in ps_fields if f not in ps]
            if ps_missing:
                print(f"[FAIL] Missing pipeline_scores fields: {ps_missing}")
                return False

            # Check explainability structure
            exp = data['explainability']
            exp_fields = ['contributing_words', 'contributing_features', 'ocr_text']
            exp_missing = [f for f in exp_fields if f not in exp]
            if exp_missing:
                print(f"[FAIL] Missing explainability fields: {exp_missing}")
                return False

            # Check fusion_weights_used structure
            fw = data['fusion_weights_used']
            fw_fields = ['text', 'metadata', 'image']
            fw_missing = [f for f in fw_fields if f not in fw]
            if fw_missing:
                print(f"[FAIL] Missing fusion_weights_used fields: {fw_missing}")
                return False

            print("[PASS] All required fields present!")
            print(f"   Response structure matches SentinelResponse")
            return True
        else:
            print(f"[FAIL] Failed with status: {response.status_code}")
            return False
    except Exception as e:
        print(f"[FAIL] Error: {e}")
        return False

def main():
    print("\n" + "#"*50)
    print("#  SentinelAI API Integration Tests")
    print("#"*50)

    results = {
        "Health Check": test_health(),
        "Predict SPAM": test_predict_text_only(),
        "Predict HAM": test_predict_ham(),
        "Response Structure": test_response_structure(),
    }

    print("\n" + "="*50)
    print("SUMMARY")
    print("="*50)

    passed = sum(1 for v in results.values() if v)
    total = len(results)

    for name, result in results.items():
        status = "[PASS] PASS" if result else "[FAIL] FAIL"
        print(f"  {status} - {name}")

    print(f"\nTotal: {passed}/{total} tests passed")

    if passed == total:
        print("\nSUCCESS: All tests passed! Backend is ready for frontend integration.")
    else:
        print("\nWARNING: Some tests failed. Check the errors above.")

    return passed == total

if __name__ == "__main__":
    main()
