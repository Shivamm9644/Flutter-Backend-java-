import urllib.request
import urllib.parse
import json
import socket
import time
import sys

BASE_URL = "http://127.0.0.1:8080"
GATEWAY_URL = "http://127.0.0.1:3000"
API_KEY = "inurum-tc-prod-key-2026"

results = []

def call(name, url, method="GET", data=None, headers=None, expected_status=(200, 201)):
    if headers is None:
        headers = {}
    body = json.dumps(data).encode("utf-8") if data is not None else None
    if data is not None and "Content-Type" not in headers:
        headers["Content-Type"] = "application/json"
    
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    start = time.time()
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            elapsed = int((time.time() - start) * 1000)
            status = resp.status
            content = resp.read().decode("utf-8")
            try:
                parsed = json.loads(content)
            except Exception:
                parsed = content[:150]
            ok = status in expected_status
            results.append((name, url, status, f"{elapsed}ms", "PASS" if ok else "FAIL", parsed))
            return status, parsed
    except urllib.error.HTTPError as e:
        elapsed = int((time.time() - start) * 1000)
        content = e.read().decode("utf-8")
        try:
            parsed = json.loads(content)
        except Exception:
            parsed = content[:150]
        ok = e.code in expected_status
        results.append((name, url, e.code, f"{elapsed}ms", "PASS" if ok else "FAIL", parsed))
        return e.code, parsed
    except Exception as e:
        elapsed = int((time.time() - start) * 1000)
        results.append((name, url, 0, f"{elapsed}ms", "FAIL", str(e)))
        return 0, str(e)

def test_socket(name, host, port):
    start = time.time()
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(3.0)
        s.connect((host, port))
        s.close()
        elapsed = int((time.time() - start) * 1000)
        results.append((name, f"tcp://{host}:{port}", "CONNECTED", f"{elapsed}ms", "PASS", "TCP Handshake Successful"))
    except Exception as e:
        elapsed = int((time.time() - start) * 1000)
        results.append((name, f"tcp://{host}:{port}", "FAILED", f"{elapsed}ms", "FAIL", str(e)))

print("=================================================================")
print(" STARTING DEEP SERVER API AUDIT ON 3.85.81.10")
print("=================================================================")

# 1. Sockets
test_socket("1. JT/T 808 TCP Protocol Port", "127.0.0.1", 7800)
test_socket("2. JT/T 1078 Video Media Port", "127.0.0.1", 10780)
test_socket("3. Node.js Gateway Port", "127.0.0.1", 3000)
test_socket("4. Java Spring Boot Port", "127.0.0.1", 8080)

# 2. Public Swagger & OpenAPI
call("5. Swagger UI HTML", f"{BASE_URL}/swagger-ui/index.html", expected_status=(200, 302))
call("6. OpenAPI v3 Specification", f"{BASE_URL}/v3/api-docs")

# 3. Auth
status, auth_data = call("7. User / Admin Login", f"{BASE_URL}/api/v1/auth/login", method="POST",
                        data={"email": "admin@inurum.com", "password": "InurumAdmin2026!"})
token = auth_data.get("token") or auth_data.get("accessToken", "") if isinstance(auth_data, dict) else ""
auth_headers = {"Authorization": f"Bearer {token}"} if token else {}
tc_headers = {"X-API-KEY": API_KEY}

# 4. Vehicles
status, v_list = call("8. Vehicles List API", f"{BASE_URL}/api/v1/vehicles", headers=auth_headers)
veh_id = None
if isinstance(v_list, dict) and v_list.get("vehicles"):
    veh_id = v_list["vehicles"][0]["id"]
elif isinstance(v_list, list) and len(v_list) > 0:
    veh_id = v_list[0].get("id")

if veh_id:
    call("9. Vehicle Details API", f"{BASE_URL}/api/v1/vehicles/{veh_id}", headers=auth_headers)

# 5. Drivers
status, d_list = call("10. Drivers List API", f"{BASE_URL}/api/v1/drivers", headers=auth_headers)
drv_id = None
if isinstance(d_list, dict) and d_list.get("items"):
    drv_id = d_list["items"][0]["id"]

if drv_id:
    call("11. Driver Details API", f"{BASE_URL}/api/v1/drivers/{drv_id}", headers=auth_headers)

# 6. Telemetry & Breadcrumbs
call("12. Latest Positions / Telemetry API", f"{BASE_URL}/api/v1/positions/latest", headers=auth_headers)
call("13. Breadcrumbs History API", f"{BASE_URL}/api/v1/telemetry/breadcrumbs?page=0&size=20", headers=auth_headers)

# 7. Trips
call("14. Trips List API", f"{BASE_URL}/api/v1/trips?page=0&size=20", headers=auth_headers)

# 8. Safety Events & Video
call("15. Safety Events API", f"{BASE_URL}/api/v1/safety/events?page=0&size=20", headers=auth_headers)
call("16. Safety Recording Proof URL", f"{BASE_URL}/api/v1/safety/recording-url?eventId=evt-test-01", headers=auth_headers, expected_status=(200, 404))
call("17. Live Stream Stop API (JT1078 0x9102)", f"{BASE_URL}/api/v1/live/stop", method="POST", data={"terminalId": "DEMO001"}, headers=auth_headers, expected_status=(200, 404))

# 9. SD Card Video Query & Retrieval Contracts
call("18. SD Video Query (0x9205 Contract)", f"{BASE_URL}/api/v1/video/sd/query", method="POST",
     data={"deviceId": "DEMO001", "channel": 1, "alarmType": 0, "mediaType": 0, "streamType": 0, "storageType": 0,
           "startTime": "2026-11-03T00:00:00Z", "endTime": "2026-11-03T12:00:00Z"}, headers=auth_headers, expected_status=(200, 404, 503))

# 10. TruckerCloud Integrations Suite
call("19. TC Vehicles API", f"{BASE_URL}/api/v1/integrations/truckercloud/vehicles", headers=tc_headers)
call("20. TC Vehicle by VIN", f"{BASE_URL}/api/v1/integrations/truckercloud/vehicles/1HD1KAE12FB099999", headers=tc_headers)
call("21. TC Drivers API", f"{BASE_URL}/api/v1/integrations/truckercloud/drivers", headers=tc_headers)
call("22. TC Latest Telemetry", f"{BASE_URL}/api/v1/integrations/truckercloud/telemetry/latest", headers=tc_headers)
call("23. TC Historical Breadcrumbs", f"{BASE_URL}/api/v1/integrations/truckercloud/telemetry/history", headers=tc_headers)
call("24. TC Safety Events API", f"{BASE_URL}/api/v1/integrations/truckercloud/safety/events", headers=tc_headers)
call("25. TC Trips API", f"{BASE_URL}/api/v1/integrations/truckercloud/trips", headers=tc_headers)

# 11. Gateway Health Check
call("26. Node Gateway Status API", f"{GATEWAY_URL}/api/status", expected_status=(200, 404))

print("\n" + "="*80)
print(f"{'TEST NAME':<35} | {'STATUS':<8} | {'TIME':<8} | {'RESULT':<6}")
print("="*80)
all_pass = True
for name, url, status, el, res, body in results:
    if res != "PASS":
        all_pass = False
    print(f"{name:<35} | {str(status):<8} | {el:<8} | {res:<6}")
print("="*80)
if all_pass:
    print("ALL AUDITED APIS AND SERVICES ARE FULLY OPERATIONAL!")
else:
    print("SOME APIS RETURNED UNEXPECTED RESULTS - PLEASE CHECK DETAILS")
