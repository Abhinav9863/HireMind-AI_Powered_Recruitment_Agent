
import os
from dotenv import load_dotenv
from groq import Groq
import sys

# Force load .env
load_dotenv()

api_key = os.environ.get("GROQ_API_KEY")
print(f"API Key present: {bool(api_key)}")
if api_key:
    print(f"API Key prefix: {api_key[:4]}...")

try:
    client = Groq(api_key=api_key)
    print("Attempting to call Groq API...")
    completion = client.chat.completions.create(
        messages=[
            {"role": "user", "content": "Hello, are you working?"}
        ],
        model="llama-3.3-70b-versatile",
    )
    print("Response:", completion.choices[0].message.content)
    print("✅ Groq API is working!")
except Exception as e:
    print(f"❌ Groq API failed: {e}")
    sys.exit(1)
