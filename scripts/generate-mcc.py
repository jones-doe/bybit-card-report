#!/usr/bin/env python3
"""Regenerates src/lib/mcc-data.ts.

    curl -sL https://raw.githubusercontent.com/greggles/mcc-codes/main/mcc_codes.csv -o mcc.csv
    python3 scripts/generate-mcc.py   # writes mcc.ts, copy it to src/lib/mcc-data.ts

Source dataset is public domain (Unlicense).
"""
import csv, json, collections

GROUPS = [
    ('Продукты', [5411,5422,5441,5451,5462,5499,5297,5298]),
    ('Кафе и рестораны', [5811,5812,5813,5814]),
    ('Топливо', [5172,5541,5542,5552,5983]),
    ('Транспорт', [4111,4112,4121,4131,4457,4468,4784,4789,7511,7512,7513,7519,7523,7524,
                   5013,5511,5521,5531,5532,5533,5571,5592,5598,5599,7531,7534,7535,7538,7542,7549]),
    ('Путешествия', [4411,4511,4582,4722,4723,7011,7012,7032,7033]),
    ('Цифровые товары и подписки', [5815,5816,5817,5818,5734,5735,7372,4816]),
    ('Связь и интернет', [4812,4813,4814,4815,4821,4899]),
    ('Коммунальные услуги', [4900]),
    ('Здоровье', [4119,5047,5122,5912,5975,5976,8011,8021,8031,8041,8042,8043,8049,8050,8062,8071,8099]),
    ('Одежда и обувь', [5137,5139,5611,5621,5631,5641,5651,5655,5661,5681,5691,5697,5698,5699,
                        5931,5948,5949,7251]),
    ('Электроника', [5044,5045,5065,5722,5732,5733,5946,7622,7623,7629]),
    ('Дом и ремонт', [1711,1731,1740,1750,1761,1771,1799,5021,5039,5051,5074,5085,5198,5200,5211,
                      5231,5251,5261,5712,5713,5714,5718,5719,5950,5978,5996,5997,5998,7217,7342,
                      7349,7641,7692,7699]),
    ('Красота и уход', [5977,7230,7296,7297,7298,7299]),
    ('Спорт и фитнес', [5940,5941,7941,7997,7998,7999]),
    ('Развлечения', [7829,7832,7841,7911,7922,7929,7932,7933,7991,7992,7993,7994,7996]),
    ('Образование', [5942,5943,8211,8220,8241,8244,8249,8299]),
    ('Страхование', [5960,6300]),
    ('Финансы и переводы', [4829,6010,6011,6012,6050,6051,6211,6381,6399,6529,6530,6532,6533,6534,
                            6535,6536,6537,6538,6540]),
    ('Госуслуги', [9211,9222,9223,9311,9399,9402,9405,9700,9701,9702,9950]),
    ('Благотворительность', [8398,8641,8651,8661,8675,8699]),
]

RANGES = [
    ('Путешествия', [(3000, 3999)]),
    ('Услуги', [(1, 1499)]),
    ('Дом и ремонт', [(1500, 2999)]),
    ('Транспорт', [(4000, 4799)]),
    ('Связь и интернет', [(4800, 4999)]),
    ('Магазины и маркетплейсы', [(5000, 5599)]),
    ('Одежда и обувь', [(5600, 5699)]),
    ('Магазины и маркетплейсы', [(5700, 7299)]),
    ('Услуги', [(7300, 8999)]),
    ('Госуслуги', [(9000, 9999)]),
]

rows = list(csv.DictReader(open('mcc.csv')))
descriptions = {}
for r in rows:
    code = r['mcc'].strip()
    desc = (r['edited_description'] or r['combined_description'] or '').strip()
    if code and desc:
        descriptions[code] = desc

explicit = {}
for group, codes in GROUPS:
    for c in codes:
        key = f'{c:04d}'
        assert key not in explicit, f'duplicate {key}: {explicit[key]} / {group}'
        explicit[key] = group

def group_of(code):
    if code in explicit:
        return explicit[code]
    n = int(code)
    for group, ranges in RANGES:
        for lo, hi in ranges:
            if lo <= n <= hi:
                return group
    return None

coverage = collections.Counter(group_of(c) or 'Прочее' for c in descriptions)
print('codes:', len(descriptions))
for g, n in coverage.most_common():
    print(f'  {n:4d}  {g}')
missing = [c for c in explicit if c not in descriptions]
print('explicit codes absent from the dataset:', missing)

ts = ['// Generated from the public-domain mcc-codes dataset (Unlicense):',
      '// https://github.com/greggles/mcc-codes',
      '// Regenerate rather than edit by hand.',
      '',
      'export const MCC_DESCRIPTIONS: Record<string, string> = {']
for code in sorted(descriptions):
    ts.append(f'  {json.dumps(code)}: {json.dumps(descriptions[code], ensure_ascii=False)},')
ts.append('}')
ts.append('')
ts.append('/** MCC → a spending group a person actually thinks in. First match wins. */')
ts.append('export const EXPLICIT_GROUPS: Record<string, string> = {')
for code in sorted(explicit):
    ts.append(f'  {json.dumps(code)}: {json.dumps(explicit[code], ensure_ascii=False)},')
ts.append('}')
ts.append('')
ts.append('/** Fallback for codes not called out above — the ISO 18245 industry blocks. */')
ts.append('export const GROUP_RANGES: Array<[number, number, string]> = [')
for group, ranges in RANGES:
    for lo, hi in ranges:
        ts.append(f'  [{lo}, {hi}, {json.dumps(group, ensure_ascii=False)}],')
ts.append(']')
open('mcc.ts', 'w').write('\n'.join(ts) + '\n')
print('written', len('\n'.join(ts)), 'bytes')
