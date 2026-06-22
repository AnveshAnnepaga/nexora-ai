import httpx
try:
    r = httpx.get("http://127.0.0.1:8000/api/v1/messages/contacts/1", timeout=5.0)
    print("Status Code:", r.status_code)
    print("Response:", r.text)
except Exception as e:
    print("Error:", e)
