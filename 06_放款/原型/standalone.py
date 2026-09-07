# -*- coding: utf-8 -*-
"""Wraps a prototype fragment in a document shell for use as a local file.

The prototypes are authored as fragments because the artifact host supplies the
<head>. A copy sent to a client is opened straight off disk, with no HTTP
headers, so it needs its own charset and viewport or the page renders in quirks
mode with mojibake.

    python3 standalone.py <fragment.html> <out.html> [title]

The title argument overrides the fragment's own: these copies go to clients in
English, while a fragment may carry a working title in Chinese.
"""
import io, os, re, sys

SHELL = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<style>
/* standalone compat reset - single file, open directly in a browser */
html{-webkit-text-size-adjust:100%%}
*{box-sizing:border-box}
body{margin:0;background:#fafafa;font:14px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif}
img{max-width:100%%}
[hidden]{display:none!important}
button,select,input,textarea{font-size:inherit;line-height:inherit;color:inherit}
</style>
<title>%s</title>
</head>
<body>
%s
</body>
</html>
'''


def wrap(src, title=None):
    """Lift the fragment's own <title> into the head, leaving the rest as-is."""
    m = re.search(r'<title>(.*?)</title>\s*', src, re.S)
    if m:
        title = title or m.group(1).strip()  # fragment title only when none given
        src = src[:m.start()] + src[m.end():]
    return SHELL % (title or 'Prototype', src.strip())


if __name__ == '__main__':
    a, b = sys.argv[1], sys.argv[2]
    t = sys.argv[3] if len(sys.argv) > 3 else None
    out = wrap(io.open(a, encoding='utf-8').read(), t)
    io.open(b, 'w', encoding='utf-8').write(out)
    print('written', b, os.path.getsize(b), 'bytes')
