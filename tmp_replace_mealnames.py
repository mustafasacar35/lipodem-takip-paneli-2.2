import re
from pathlib import Path

path = Path(r"c:\Users\Mustafa\Downloads\v25___lipodem-takip-paneli-main_cihaz_sinir_OK_reset_OK_oto_planla_modalda ayarlar_takvim_vs_ok\lipodem-takip-paneli-main\patient_nutrition.html")
text = path.read_text(encoding="utf-8")
pattern = r"const mealNames = \{.*?\};"
replacement = """const mealNames = {\n                    sabah: 'Sabah',\n                    'ara ogun': 'Ara Ogun',\n                    'ara ogun 1': 'Ara Ogun',\n                    'ara ogun 2': 'Ara Ogun',\n                    'ara \\u00f6\\u011f\\u00fcn': 'Ara Ogun',\n                    ara: 'Ara Ogun',\n                    ogle: 'Oglen',\n                    '\\u00f6\\u011fle': 'Oglen',\n                    '\\u00f6\\u011flen': 'Oglen',\n                    ikindi: 'Ikindi',\n                    '\\u0131kindi': 'Ikindi',\n                    aksam: 'Aksam',\n                    'ak\\u015fam': 'Aksam',\n                    gece: 'Gece'\n                };"""
new_text, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
if count == 0:
    raise SystemExit("mealNames block not found")
path.write_text(new_text, encoding="utf-8")
print("mealNames block updated")
