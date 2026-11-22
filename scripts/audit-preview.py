import argparse
from functools import partial
import gzip
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from io import BytesIO
from pathlib import Path
from urllib.parse import urlsplit

class Preview(SimpleHTTPRequestHandler):
    def send_head(self):
        parsed = urlsplit(self.path)
        filename = Path(self.translate_path(parsed.path))
        if filename.is_dir():
            filename = filename / 'index.html'
        try:
            data = filename.read_bytes()
        except OSError:
            return super().send_head()
        filetype = self.guess_type(str(filename))
        compressible = filename.suffix in {'.html', '.css', '.js', '.json', '.svg', '.webmanifest'}
        use_gzip = compressible and 'gzip' in self.headers.get('Accept-Encoding', '')
        if use_gzip:
            data = gzip.compress(data, compresslevel=6, mtime=0)
        self.send_response(200)
        self.send_header('Content-Type', filetype)
        self.send_header('Content-Length', str(len(data)))
        if compressible:
            self.send_header('Vary', 'Accept-Encoding')
        if use_gzip:
            self.send_header('Content-Encoding', 'gzip')
        if parsed.path.startswith('/assets/'):
            self.send_header('Cache-Control', 'public, max-age=31536000, immutable')
        self.end_headers()
        return BytesIO(data)

args = argparse.ArgumentParser()
args.add_argument('directory')
args.add_argument('port', type=int)
options = args.parse_args()
ThreadingHTTPServer(('127.0.0.1', options.port), partial(Preview, directory=options.directory)).serve_forever()
