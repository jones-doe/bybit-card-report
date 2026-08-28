#!/usr/bin/env python3
"""Regenerates dev/fixtures/assetRecords.json.

    python3 dev/fixtures/generate_asset_records.py

Deterministic (fixed seed) synthetic history in the exact shape Bybit sends —
numbers as strings, scientific notation, padded merchant/city names — covering
every code path the app handles:

  - side 1  Authorization         → hold, excluded from sums, shown "не списано"
  - side 3  Transaction            → ordinary purchase
  - side 5  Refund                 → nets against its month and its merchant
  - side 6  Chargeback             → also a refund, different label
  - a non-USD record with no USD field at all → "нет USD" / unresolved
  - 9 distinct MCC categories, so the categorical fold to "Прочее" triggers
  - one category (Groceries) with 10 merchants, so the per-category merchant
    fold to "ещё N" triggers
  - a deliberately huge day (paycheck-day spending) so the calendar heat scale
    has real spread across all 5 steps
  - dates run up to "today" at generation time and never drift into the future
"""
import json
import random
from datetime import datetime, timedelta

random.seed(20260820)

# name, mcc, category (for reference only — the app derives category from mcc)
GROCERY_CHAIN = [
    "LIDL", "TESCO", "ALDI", "CARREFOUR", "SPAR", "REWE", "EDEKA", "COOP",
    "MIGROS", "WAITROSE",
]
MERCHANTS = {
    "5411": [(n, 0.6) for n in GROCERY_CHAIN],  # Продукты — 10 merchants, triggers fold
    "5814": [("STARBUCKS", 0.4), ("PRET A MANGER", 0.3), ("MCDONALDS", 0.3)],  # Кафе
    "3000": [("PEGASUS", 0.6), ("RYANAIR", 0.4)],  # Путешествия (airline MCC)
    "5541": [("SHELL", 0.6), ("BP", 0.4)],  # Топливо
    "5817": [("APPLE.COM/BILL", 0.5), ("STEAMGAMES.COM", 0.5)],  # Цифровые товары
    "5651": [("ASOS", 0.5), ("ZARA", 0.5)],  # Одежда
    "5912": [("PHARMACY 24H", 1.0)],  # Здоровье
    "7997": [("GYM PASS", 1.0)],  # Спорт
    "4899": [("NETFLIX.COM", 1.0)],  # Связь и интернет
}
CITY_COUNTRY = [("London", "GBR"), ("Berlin", "DEU"), ("Amsterdam", "NLD"), ("Warsaw", "POL")]

def pick(weighted):
    names, weights = zip(*weighted)
    return random.choices(names, weights=weights, k=1)[0]

def pad(s, width):
    return s + " " * max(0, width - len(s))

records = []
uid = "31870020"
today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
start = (today.replace(day=1) - timedelta(days=150)).replace(day=1)  # ~5 full months back

day = start
txn_seq = 0
while day <= today:
    n = random.choices([0, 1, 2, 3, 4], weights=[10, 30, 30, 20, 10])[0]
    # One reliably large day per month (payday-ish) so the heat scale spans all 5 steps.
    if day.day == 5:
        n = max(n, 6)
    for _ in range(n):
        txn_seq += 1
        mcc = random.choice(list(MERCHANTS))
        merchant = pick(MERCHANTS[mcc])
        city, country = random.choice(CITY_COUNTRY)
        amount = round(random.uniform(3, 30) if random.random() < 0.6 else random.uniform(30, 320), 2)
        ts_ms = int((day + timedelta(hours=random.randint(6, 22), minutes=random.randint(0, 59))).timestamp() * 1000)

        records.append({
            "pan4": "9741",
            "pan6": "537872",
            "tradeStatus": "1",
            "side": "3",
            "basicAmount": f"{amount:.2f}",
            "basicCurrency": "USD",
            "transactionAmount": f"{amount:.2f}",
            "transactionCurrency": "USD",
            "transactionCurrencyAmount": f"{amount:.2f}",
            "txnCreate": str(ts_ms),
            "merchCountry": country,
            "merchCity": pad(city, 13),
            "merchName": pad(merchant, 23),
            "txnId": f"FIX{txn_seq:06d}",
            "declinedReason": "0",
            "totalFees": "0",
            "uid": uid,
            "fxPad": "0",
            "interchangeFee": "0.06",
            "billAmount": f"{amount:.2f}",
            "paidAmount": f"{amount:.2f}",
            "paidCurrency": "USD",
            "bonusAmount": "0E-18",
            "foreignTransactionFee": "0",
            "totalTax": "0",
            "paidFiat": "0.000000000000000000",
            "withdrawalFee": "0",
            "status": "1",
            "orderNo": f"FIXORDER{txn_seq:06d}_{uid}",
            "mccCode": mcc,
            "merchCategoryDesc": mcc,
        })
    day += timedelta(days=1)

# One month gets 9 distinct one-off grocery shops so the per-category merchant
# fold ("ещё N") in the UI has something to fold. Two months back — always a
# full past month, never touching the random walk above.
fold_month = (today.replace(day=1) - timedelta(days=45)).replace(day=1)
for i, shop in enumerate([
    "CORNER SHOP", "VILLAGE STORE", "FARM MARKET", "DELI ON MAIN",
    "GREENGROCER", "BAKERY CO", "BUTCHER SHOP", "FISH MARKET", "WINE CELLAR",
]):
    txn_seq += 1
    amount = round(random.uniform(5, 40), 2)
    ts_ms = int((fold_month.replace(day=12 + i % 10) + timedelta(hours=10)).timestamp() * 1000)
    records.append({
        "pan4": "9741", "pan6": "537872", "tradeStatus": "1", "side": "3",
        "basicAmount": f"{amount:.2f}", "basicCurrency": "USD",
        "transactionAmount": f"{amount:.2f}", "transactionCurrency": "USD",
        "transactionCurrencyAmount": f"{amount:.2f}", "txnCreate": str(ts_ms),
        "merchCountry": "GBR", "merchCity": pad("London", 13), "merchName": pad(shop, 23),
        "txnId": f"FIXFOLD{i:02d}", "declinedReason": "0", "totalFees": "0", "uid": uid,
        "fxPad": "0", "interchangeFee": "0.06", "billAmount": f"{amount:.2f}",
        "paidAmount": f"{amount:.2f}", "paidCurrency": "USD", "bonusAmount": "0E-18",
        "foreignTransactionFee": "0", "totalTax": "0", "paidFiat": "0.000000000000000000",
        "withdrawalFee": "0", "status": "1", "orderNo": f"FIXFOLD{i:02d}_ORDER",
        "mccCode": "5411", "merchCategoryDesc": "5411",
    })

def add(**fields):
    base = {
        "pan4": "9741", "pan6": "537872", "tradeStatus": "1",
        "totalFees": "0", "uid": uid, "fxPad": "0", "interchangeFee": "0",
        "paidCurrency": "USD", "bonusAmount": "0E-18", "foreignTransactionFee": "0E-8",
        "totalTax": "0", "paidFiat": "0", "withdrawalFee": "0", "status": "1",
        "declinedReason": "0",
    }
    base.update(fields)
    records.append(base)

# ── Regression fixtures — the exact bug shapes this app has already hit ────

# A real purchase + refund pair (same shape as the PEGASUS report that showed
# `side` is a numeric code, not a word).
purchase_ts = int((today - timedelta(days=10)).timestamp() * 1000)
refund_ts = int((today - timedelta(days=8)).timestamp() * 1000)
add(side="3", basicAmount="295.24", basicCurrency="USD", transactionAmount="295.24",
    transactionCurrency="USD", transactionCurrencyAmount="0E-10", txnCreate=str(purchase_ts),
    merchCountry="GBR", merchCity=pad("UK", 13), merchName=pad("PEGASUS", 23),
    txnId="FIXREFUND-PURCHASE", billAmount="295.24", paidAmount="295.24",
    orderNo="FIXREFUND-PURCHASE_ORDER", mccCode="3000", merchCategoryDesc="3000")
add(side="5", basicAmount="293.24", basicCurrency="USD", transactionAmount="293.24",
    transactionCurrency="USD", transactionCurrencyAmount="293.24", txnCreate=str(refund_ts),
    merchCountry="GBR", merchCity=pad("UK", 13), merchName=pad("PEGASUS", 23),
    txnId="FIXREFUND-REFUND", billAmount="293.24", paidAmount="293.24",
    orderNo="FIXREFUND-REFUND_ORDER", mccCode="3000", merchCategoryDesc="3000")

# Chargeback — also a refund, but a different documented code and label.
add(side="6", basicAmount="45.00", basicCurrency="USD", transactionAmount="45.00",
    transactionCurrency="USD", txnCreate=str(int((today - timedelta(days=15)).timestamp() * 1000)),
    merchCountry="GBR", merchCity=pad("London", 13), merchName=pad("DISPUTED VENDOR", 23),
    txnId="FIXCHARGEBACK", billAmount="45.00", paidAmount="45.00",
    orderNo="FIXCHARGEBACK_ORDER", mccCode="5999", merchCategoryDesc="5999")

# Authorization hold — no settled money, must not enter any sum.
add(side="1", basicAmount="120.00", basicCurrency="USD", transactionAmount="120.00",
    transactionCurrency="USD", txnCreate=str(int((today - timedelta(hours=3)).timestamp() * 1000)),
    merchCountry="GBR", merchCity=pad("London", 13), merchName=pad("HOTEL HOLD", 23),
    txnId="FIXHOLD", billAmount="120.00", paidAmount="120.00",
    orderNo="FIXHOLD_ORDER", mccCode="7011", merchCategoryDesc="7011")

# Non-USD record with no USD field anywhere — must show as "нет USD" and count
# toward totals.unresolvedCount without breaking the sums.
add(side="3", basicAmount="", basicCurrency="", transactionAmount="4200.00",
    transactionCurrency="JPY", txnCreate=str(int((today - timedelta(days=20)).timestamp() * 1000)),
    merchCountry="JPN", merchCity=pad("Tokyo", 13), merchName=pad("FX ONLY MERCHANT", 23),
    txnId="FIXNOUSD", billAmount="", paidAmount="", paidCurrency="JPY",
    orderNo="FIXNOUSD_ORDER", mccCode="5812", merchCategoryDesc="5812")

records.sort(key=lambda r: int(r["txnCreate"]))

out_path = "dev/fixtures/assetRecords.json"
with open(out_path, "w") as f:
    json.dump(records, f, ensure_ascii=False, indent=2)

print(f"wrote {len(records)} records to {out_path}")
print(f"date range: {start.date()} .. {today.date()}")
