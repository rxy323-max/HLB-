# -*- coding: utf-8 -*-
"""Builds one artifact containing both prototypes.

Each prototype keeps its own document inside an iframe. That is deliberate:
they were written independently and share class names (.btn, .tag, .i) and
globals (S, $, I, render). Merging their stylesheets would mean rewriting
both. Isolating them means each behaves exactly as the standalone version
that was tested, and only the navigation between them is new.
"""
import re, os, datetime

# Every generated file carries the date it was built. A copy sent to a client is
# a frozen snapshot, so both sides need to be able to say which one they are on.
STAMP = datetime.date.today().strftime('%Y-%m-%d')

HERE = os.path.dirname(os.path.abspath(__file__))
WB = open(os.path.join(HERE, 'cra-workbench.html'), encoding='utf-8').read()
FC = open(os.path.join(HERE, 'doc-center-proto.html'), encoding='utf-8').read()

# each prototype is authored as a fragment; the artifact skeleton normally
# supplies the document shell, so give each iframe its own.
SHELL = '''<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>html{-webkit-text-size-adjust:100%%}*{box-sizing:border-box}
body{margin:0;background:#fafafa;font:14px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif}
img{max-width:100%%}[hidden]{display:none!important}
button,select,input,textarea{font-size:inherit;line-height:inherit;color:inherit}
.xnav{display:inline-flex;border:1px solid rgba(255,255,255,.22);border-radius:4px;overflow:hidden;margin-left:14px}
.xnav button{background:transparent;border:0;color:rgba(255,255,255,.62);
  padding:3px 11px;font-size:11.5px;cursor:pointer;font-family:inherit;white-space:nowrap}
.xnav button:hover{color:#fff}
.xnav button[aria-current="true"]{background:#1677ff;color:#fff}
</style></head><body>
%s
<script>
(function(){
  "use strict";
  var HERE = %s;

  /* Put the cross-prototype switch inside the existing demo bar rather than
     floating it over the page, so it reads as part of the same chrome. */
  var bar = document.querySelector('.demo');
  if (bar) {
    var nav = document.createElement('span');
    nav.className = 'xnav';
    nav.innerHTML =
      '<button data-xnav="cra">CRA Workbench</button>' +
      '<button data-xnav="sales">Sales Workbench</button>' +
      '<button data-xnav="fc">File Center</button>';
    var why = bar.querySelector('.why');
    if (why) bar.insertBefore(nav, why); else bar.appendChild(nav);
  }
  if (why0()) why0().textContent = 'Prototype build ' + %s;
  function why0(){ return bar && bar.querySelector('.why'); }

  function go(to){ parent.postMessage({ nav: to }, '*'); }


  /* The two screens share one defect ledger: it is raised in the File Center, in
     front of the document, and read in the Workbench. Isolation keeps the styles
     and globals apart but must not split the ledger in two, or the demo shows the
     one thing the design says never happens. */
  document.addEventListener('defect:raised', function(e){
    parent.postMessage({ defect: e.detail }, '*');
  });
  document.addEventListener('case:revalidated', function(e){
    parent.postMessage({ revalidated: e.detail }, '*');
  });
  // marks which prototype this frame is, so the host can address it
  parent.postMessage({ hello: HERE }, '*');
  window.addEventListener('message', function(e){
    var d = e.data && e.data.defect;
    if (d) document.dispatchEvent(new CustomEvent('defect:import', { detail: d }));
  });

  /* Capture phase, so the prototype's own handler never runs for these -
     otherwise the workbench would toast "Opening File Center" and stay put. */
  document.addEventListener('click', function(e){
    var x = e.target.closest('[data-xnav]');
    if (x) { e.preventDefault(); e.stopPropagation(); go(x.dataset.xnav); return; }
    var t = e.target.closest(%s);
    if (t) { e.preventDefault(); e.stopPropagation(); go(%s); }
  }, true);
  window.addEventListener('message', function(e){
    if (e.data && e.data.here) {
      var b = nav && nav.querySelectorAll('[data-xnav]');
      if (b) for (var i=0;i<b.length;i++)
        b[i].setAttribute('aria-current', b[i].dataset.xnav === e.data.here ? 'true' : 'false');
    }
  });
}());
<\\/script>
</body></html>'''

# the workbench's three routes into the file center
WB_DOC = SHELL % (WB, "'wb'", "'" + STAMP + "'", "'[data-shim-none]'", "'fc'")
# the file centre's ways out: the modal close, and Back To List in the footer.
# #dtBack is excluded - that closes the document detail, it does not leave.
FC_DOC = SHELL % (FC, "'fc'", "'" + STAMP + "'", "'#mClose, .file-list-footer-actions .back-btn'", "'back'")


def embed(doc):
    """Store a whole document inside a <script type="text/html"> block."""
    return doc.replace('</script>', '<\\/script>')


HOST = '''<title>HLB Disbursement Prototype</title>
<style>
html,body{height:100%%;margin:0;background:#0d1424}
#stage{position:fixed;inset:0}
#stage iframe{position:absolute;inset:0;width:100%%;height:100%%;border:0;background:#fafafa}
#stage iframe[hidden]{display:none}
#boot{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;
  background:#0d1424;color:rgba(255,255,255,.5);font:13px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;
  letter-spacing:.04em}
</style>

<div id="stage">
  <iframe id="fr-wb" title="Workbench"></iframe>
  <iframe id="fr-fc" title="File Center" hidden></iframe>
</div>
<div id="boot">Loading prototype…</div>

<script type="text/html" id="src-wb">%s</script>
<script type="text/html" id="src-fc">%s</script>

<script>
(function(){
  "use strict";
  /* Three entries, two documents. CRA and Sales are the same workbench seen from
     two desks - the whole point of the defect list is that both read one ledger -
     so they share a frame and the host tells it which desk is on screen. */
  var frames = { wb: document.getElementById('fr-wb'), fc: document.getElementById('fr-fc') };
  var loaded = {};
  var DEST = { cra: 'wb', sales: 'wb', fc: 'fc' };
  var here = 'cra';        // which entry is on screen
  var desk = 'cra';        // which desk the workbench is showing
  var cameFrom = 'cra';    // the desk that opened the File Center

  function source(k){
    // undo the closing-tag escaping applied at build time
    return document.getElementById('src-' + k).textContent.replace(/<\\\\\\/script>/g, '<\\/script>');
  }

  /* loaded means the source has been handed to the frame; ready means the frame
     has parsed it and wired its listeners. Posting between the two is silent data
     loss - the message reaches a document that is about to be replaced. */
  var ready = {};
  function post(k, msg){
    if (!ready[k]) return false;
    try { frames[k].contentWindow.postMessage(msg, '*'); return true; } catch (e) { return false; }
  }

  function show(dest){
    var k = DEST[dest]; if (!k) return;
    if (!loaded[k]) { frames[k].srcdoc = source(k); loaded[k] = 1; }
    Object.keys(frames).forEach(function(n){ frames[n].hidden = (n !== k); });
    here = dest;
    try { history.replaceState(null, '', '#' + dest); } catch (e) {}
    if (k === 'wb' && dest !== desk) { desk = dest; post('wb', { setDesk: desk }); }
    post('wb', { here: here }); post('fc', { here: here });
    setTimeout(function(){ try { frames[k].contentWindow.focus(); } catch (e) {} }, 0);
  }

  /* Anything raised in one document that the other has to know about is relayed
     here. A frame may not exist yet - the host boots whichever entry the URL asks
     for - so messages for a sleeping frame are held and replayed on load. */
  var pending = { wb: [], fc: [] };
  function relay(k, msg){ if (!post(k, msg)) pending[k].push(msg); }
  Object.keys(frames).forEach(function(k){
    frames[k].addEventListener('load', function(){
      // one tick, so the document has finished wiring its own listeners
      setTimeout(function(){
        ready[k] = 1;
        if (k === 'wb' && desk !== 'cra') post('wb', { setDesk: desk });
        post(k, { here: here });
        pending[k].splice(0).forEach(function(m){ post(k, m); });
      }, 0);
    });
  });

  window.addEventListener('message', function(e){
    var d = e.data || {};
    if (d.nav === 'back') { show(cameFrom); return; }
    if (DEST[d.nav]) { show(d.nav); return; }
    if (d.defect) { relay('wb', { defect: d.defect }); return; }
    if (d.revalidated) { relay('wb', { revalidated: d.revalidated }); return; }
    /* A desk opened the File Center on a defect. Remember the door so Back returns
       through it, and hand the view across rather than letting the File Center
       guess who is looking. */
    if (d.fcOpen) {
      cameFrom = d.fcOpen.view === 'sales' ? 'sales' : 'cra';
      show('fc'); relay('fc', { fcView: d.fcOpen }); return;
    }
    if (d.handBack) { desk = 'x'; show('cra'); return; }
  });

  var start = (location.hash || '').replace('#', '');
  show(DEST[start] ? start : 'cra');
  frames.wb.addEventListener('load', function(){
    var b = document.getElementById('boot'); if (b) b.remove();
  });
}());
</script>
''' % (embed(WB_DOC), embed(FC_DOC))

print('build stamp:', STAMP)
out = os.path.join(HERE, 'merged-prototype.html')
open(out, 'w', encoding='utf-8').write(HOST)
print('written', out, os.path.getsize(out), 'bytes')
