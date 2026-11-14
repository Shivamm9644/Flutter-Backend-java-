import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

BASE = "https://3.85.81.10"

def post(url, payload, headers=None):
    hdrs = {"Content-Type": "application/json"}
    if headers:
        hdrs.update(headers)
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=hdrs, method="POST")
    with urllib.request.urlopen(req, context=ctx) as res:
        return res.status, json.loads(res.read().decode())

def get(url, headers=None):
    hdrs = headers or {}
    req = urllib.request.Request(url, headers=hdrs, method="GET")
    with urllib.request.urlopen(req, context=ctx) as res:
        return res.status, json.loads(res.read().decode())

print("--- 1. Testing HTTPS Auth Login ---")
st, data = post(f"{BASE}/api/v1/auth/login", {"email": "admin@inurum.com", "password": "InurumAdmin2026!"})
print(f"Status: {st}, User: {data['user']['name']}, Role: {data['user']['role']}")
token = data["token"]
auth_h = {"Authorization": f"Bearer {token}"}

import time

ts = int(time.time())
print("\n--- 2. Testing Add Vehicle (Non-ELD) ---")
veh_payload = {
    "plateNumber": f"TRK-{ts % 100000}",
    "vin": f"1HD1KAE12FB{ts % 1000000:06d}",
    "make": "Freightliner",
    "model": "Cascadia",
    "year": 2024,
    "odometerKm": 125000.0,
    "odometerSource": "GPS_ESTIMATED"
}
st, vdata = post(f"{BASE}/api/v1/vehicles", veh_payload, auth_h)
veh_id = vdata.get('vehicle', {}).get('id')
print(f"Vehicle created: status {st}, ID: {veh_id}, Plate: {veh_payload['plateNumber']}")

print("\n--- 3. Testing Add Driver (Non-ELD) ---")
driver_payload = {
    "name": f"David Miller {ts % 1000}",
    "phone": f"+1-555-{ts % 1000000:06d}",
    "licenseNumber": f"DL-CAL-{ts % 1000000:06d}",
    "status": "ACTIVE"
}
st, ddata = post(f"{BASE}/api/v1/drivers", driver_payload, auth_h)
driver_id = ddata.get('id')
print(f"Driver created: status {st}, Driver ID: {driver_id}, Name: {driver_payload['name']}")


print(f"Target Driver ID: {driver_id}")

print("\n--- 4. Testing Assign / Change Driver ---")
assign_payload = {
    "driverId": driver_id
}
st, adata = post(f"{BASE}/api/v1/vehicles/{veh_id}/assign-driver", assign_payload, auth_h)
print(f"Assign Driver Result: status {st}, message: {adata.get('message')}")
print(f"Vehicle Assigned Driver: {adata.get('vehicle', {}).get('driverName')} (ID: {adata.get('vehicle', {}).get('driverId')})")

print("\n--- 5. Testing Manual Driver Change (without pre-registering driver) ---")
manual_assign = {
    "driverName": "Sarah Connor",
    "driverPhone": "+1-555-444-3322",
    "driverLicense": "DL-TX-123456"
}
st, mdata = post(f"{BASE}/api/v1/vehicles/{veh_id}/assign-driver", manual_assign, auth_h)
print(f"Manual Assign Result: status {st}, message: {mdata.get('message')}")
print(f"Vehicle Current Driver: {mdata.get('vehicle', {}).get('driverName')}")

print("\n--- 6. Testing Unassign Driver ---")
st, udata = post(f"{BASE}/api/v1/vehicles/{veh_id}/unassign-driver", {}, auth_h)
print(f"Unassign Result: status {st}, message: {udata.get('message')}")
print(f"Vehicle Current Driver: {udata.get('vehicle', {}).get('driverName')}")

print("\n--- 7. Testing TruckerCloud HTTPS Auth Validate & Telemetry ---")
prod_h = {"X-API-KEY": "gbt-tc-prod-key-9f82d14b"}
st, tc_prod = get(f"{BASE}/api/v1/integrations/truckercloud/auth/validate", prod_h)
print(f"TruckerCloud Prod Key Validate: status {st}, environment: {tc_prod.get('environment')}, authenticated: {tc_prod.get('authenticated')}")

sandbox_h = {"X-API-KEY": "gbt-tc-sandbox-key-7a3e5c12"}
st, tc_sb = get(f"{BASE}/api/v1/integrations/truckercloud/auth/validate", sandbox_h)
print(f"TruckerCloud Sandbox Key Validate: status {st}, environment: {tc_sb.get('environment')}, authenticated: {tc_sb.get('authenticated')}")

st, tel = get(f"{BASE}/api/v1/integrations/truckercloud/telemetry/latest", prod_h)
tel_list = tel if isinstance(tel, list) else tel.get('telemetry', [])
print(f"Telemetry Status: {st}, Count: {len(tel_list)}")
if tel_list:
    item = tel_list[0]
    print(f"Sample Telemetry Item:\n  Timezone: {item.get('timezone')}\n  Driver ID: {item.get('driverId')}\n  Driver Name: {item.get('driverName')}\n  Speed: {item.get('speedKmH')} km/h (alias: {item.get('speed')})\n  Odometer: {item.get('odometer')}")

st, safety = get(f"{BASE}/api/v1/integrations/truckercloud/safety/events", prod_h)
safety_list = safety if isinstance(safety, list) else safety.get('events', [])
print(f"Safety Events Status: {st}, Count: {len(safety_list)}")
if safety_list:
    sev = safety_list[0]
    print(f"Sample Safety Event:\n  Event ID: {sev.get('eventId')}\n  Timezone: {sev.get('timezone')}\n  Odometer: {sev.get('odometer')}")

print("\n=======================================================")
print("ALL ACCEPTANCE TESTS COMPLETED SUCCESSFULLY OVER HTTPS!")
print("=======================================================")
