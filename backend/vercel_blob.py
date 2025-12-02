def put(filename, content, options=None):
    print(f"Mock upload: {filename}")
    return {"url": f"http://mock-storage/{filename}"}

def delete(url):
    print(f"Mock delete: {url}")
