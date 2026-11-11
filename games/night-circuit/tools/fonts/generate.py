"""Original vector font. Run: python -m pip install fonttools; python tools/fonts/generate.py"""
import json
import math
import unicodedata
from pathlib import Path
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

ROOT = Path(__file__).resolve().parents[2]
patterns = json.loads((ROOT / 'src/gen/textures/glyphs.json').read_text(encoding='utf-8'))
strokes = json.loads((ROOT / 'src/gen/textures/typeface.json').read_text(encoding='utf-8'))
codes = list(range(32, 256)) + [0x2013, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2026, 0x2033, 0x20ac, 0x2190, 0x2191, 0x2192, 0x2193, 0x2197, 0x2212, 0x25cf]
order = ['.notdef'] + [f'u{c:04x}' for c in codes]
for suffix, style, thickness, weight in [('', 'Regular', 1.05, 400), ('-semibold', 'Semibold', 1.45, 600), ('-bold', 'Bold', 1.8, 700)]:
    font = FontBuilder(1000, isTTF=True)
    font.setupGlyphOrder(order)
    font.setupCharacterMap({c: f'u{c:04x}' for c in codes})
    glyphs, metrics = {}, {}
    for code, name in [(63, '.notdef')] + [(c, f'u{c:04x}') for c in codes]:
        char = chr(code)
        norm = unicodedata.normalize('NFD', char)
        base = norm[0]
        base = {'’': "'", '‘': "'", '“': '"', '”': '"', '″': '"', '–': '-', '−': '-', '×': 'x', '€': 'E', '•': '·', '…': '.'}.get(base, base)
        pen = TTGlyphPen(None)
        def polygon(points):
            pen.moveTo(points[0])
            for point in points[1:]: pen.lineTo(point)
            pen.closePath()
        def stroke(points, radius):
            for point in points:
                polygon([(point[0] + math.cos(i*math.tau/12)*radius, point[1] + math.sin(i*math.tau/12)*radius) for i in range(12)])
            for p, q in zip(points, points[1:]):
                length = math.hypot(q[0]-p[0], q[1]-p[1])
                if length < .001: continue
                nx, ny = -(q[1]-p[1])/length*radius, (q[0]-p[0])/length*radius
                polygon([(p[0]+nx,p[1]+ny),(p[0]-nx,p[1]-ny),(q[0]-nx,q[1]-ny),(q[0]+nx,q[1]+ny)])
        if base in strokes:
            glyph = strokes[base]
            for line in glyph['strokes']:
                stroke([(75+x*44+((9-glyph['width'])/2*44 if base.isdecimal() else 0),y*50) for x,y in line], thickness*24)
            advance = 546 if base.isdecimal() else int(150+glyph['width']*44)
        else:
            for row, bits in enumerate(patterns.get(base, patterns['?']).split('/')):
                for col, bit in enumerate(bits):
                    if bit == '1':
                        x,y=75+col*70, (6-row)*95
                        polygon([(x,y),(x+70,y),(x+70,y+95),(x,y+95)])
            advance=500
        if len(norm)>1:
            mark=norm[1]
            center=advance/2
            if mark=='\u0300': stroke([(center-45,870),(center+25,790)],22)
            else: stroke([(center-25,790),(center+45,870)],22)
        glyphs[name]=pen.glyph()
        metrics[name]=(advance,35)
    font.setupGlyf(glyphs)
    font.setupHorizontalMetrics(metrics)
    font.setupHorizontalHeader(ascent=930,descent=-230)
    font.setupNameTable({'familyName':'Circuit Grid','styleName':style,'uniqueFontIdentifier':f'CircuitGrid-2-{style}','fullName':f'Circuit Grid {style}','psName':f'CircuitGrid-{style}','version':'Version 2.0','copyright':'Original NIGHT CIRCUIT project vector strokes'})
    font.setupOS2(sTypoAscender=930,sTypoDescender=-230,usWinAscent=930,usWinDescent=230,usWeightClass=weight,fsSelection=0x20 if weight==700 else 0x40 if weight==400 else 0)
    font.font['head'].macStyle = 1 if weight == 700 else 0
    font.setupPost()
    font.setupMaxp()
    out=ROOT/f'public/fonts/circuit-grid{suffix}.ttf'
    out.parent.mkdir(parents=True,exist_ok=True)
    font.save(out)
    print(out)
