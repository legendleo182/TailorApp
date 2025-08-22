#!/usr/bin/env python3
"""
Development server for Tailor CRM with cache-busting headers
"""
import http.server
import socketserver
import os
import sys
from urllib.parse import urlparse

class CacheBustingHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add cache-busting headers for development
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()
    
    def do_GET(self):
        # Parse the URL
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        
        # Serve the file
        return super().do_GET()

def main():
    PORT = 8000
    
    # Change to the directory containing this script
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    print(f"Starting development server on http://localhost:{PORT}")
    print("Cache-busting enabled - changes should appear immediately!")
    print("Press Ctrl+C to stop the server")
    print("\nKeyboard shortcuts:")
    print("  Ctrl+Shift+R: Clear cache and reload")
    print("  Ctrl+Shift+C: Clear cache only")
    print("  Ctrl+R: Force reload from server")
    
    try:
        with socketserver.TCPServer(("", PORT), CacheBustingHTTPRequestHandler) as httpd:
            print(f"\nServer running at http://localhost:{PORT}")
            print("Open this URL in your browser")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"Port {PORT} is already in use. Try a different port:")
            print(f"python dev-server.py {PORT + 1}")
        else:
            print(f"Error: {e}")

if __name__ == "__main__":
    main()
