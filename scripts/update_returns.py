import yfinance as yf
import json
import os
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta

def get_return(ticker, years):
    try:
        stock = yf.Ticker(ticker)
        # We need historical data for today and for 'years' ago
        end_date = datetime.now()
        start_date = end_date - relativedelta(years=years)
        
        # Format dates for yfinance
        start_str = (start_date - timedelta(days=5)).strftime('%Y-%m-%d')
        end_str = (end_date + timedelta(days=1)).strftime('%Y-%m-%d')
        
        hist = stock.history(start=start_str, end=end_str)
        if hist.empty:
            return None
        
        # Get the price closest to the start date
        past_prices = hist.loc[:start_date.strftime('%Y-%m-%d')]
        if past_prices.empty:
            past_price = hist.iloc[0]['Close']
        else:
            past_price = past_prices.iloc[-1]['Close']
            
        current_price = hist.iloc[-1]['Close']
        
        # Calculate multiplier (e.g. 1.45 for 45% return)
        multiplier = current_price / past_price
        return round(multiplier, 4)
    except Exception as e:
        print(f"Error fetching data for {ticker}: {e}")
        return None

import requests
from bs4 import BeautifulSoup

def get_gemel_averages():
    # Returns a dict with "1", "3", "5" multipliers for the general track
    try:
        # URL for "קופת גמל להשקעה - כללי"
        url = "https://www.mygemel.net/%D7%A7%D7%95%D7%A4%D7%AA-%D7%92%D7%9E%D7%9C-%D7%9C%D7%94%D7%A9%D7%A7%D7%A2%D7%94/%D7%9B%D7%9C%D7%9C%D7%99"
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Look for the row containing "ממוצע"
        # Since table structures vary, we'll try to find "ממוצע" in any table row
        # Usually it's "ממוצע קבוצתי" or "ממוצע ענפי"
        average_row = None
        for tr in soup.find_all('tr'):
            text = tr.get_text()
            if 'ממוצע' in text:
                average_row = tr
                break
                
        if not average_row:
            print("Could not find average row in MyGemel")
            return None
            
        # The columns typically contain numbers with '%'
        # We need to extract all percentages in order. Usually: 1 month, year-to-date, 12 months, 3 years, 5 years
        # Let's use regex to find all percentages in the row text
        import re
        tds = average_row.find_all('td')
        percentages = []
        for td in tds:
            txt = td.get_text().strip()
            # Match number possibly with negative sign and decimal, followed by %
            match = re.search(r'(-?\d+\.?\d*)%', txt)
            if match:
                percentages.append(float(match.group(1)))
                
        # The table has columns like: Month, 1 Year, 3 Years, 5 Years
        # So we want the last 3 percentages.
        if len(percentages) >= 3:
            # We want 1 year (3rd from end), 3 years (2nd from end), 5 years (1st from end)
            return {
                "1": round(1 + (percentages[-3] / 100), 4),
                "3": round(1 + (percentages[-2] / 100), 4),
                "5": round(1 + (percentages[-1] / 100), 4)
            }
        else:
            print(f"Not enough percentage columns found: {percentages}")
            return None
            
    except Exception as e:
        print(f"Error scraping MyGemel: {e}")
        return None

def main():
    # Define tickers
    tickers = {
        'sp500': '^GSPC',
        'nasdaq': '^NDX',
        'ta125': '^TA125.TA'
    }
    
    # We will load the existing json to preserve the static tracks (general, halacha, solid)
    json_path = os.path.join(os.path.dirname(__file__), '..', 'assets', 'market_returns.json')
    
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        # Fallback if file doesn't exist
        data = {
            "sp500": {"1": 1.15, "3": 1.45, "5": 2.05},
            "nasdaq": {"1": 1.25, "3": 1.60, "5": 2.40},
            "ta125": {"1": 1.05, "3": 1.10, "5": 1.30},
            "general": {"1": 1.07, "3": 1.18, "5": 1.35},
            "halacha": {"1": 1.06, "3": 1.15, "5": 1.30},
            "solid": {"1": 1.03, "3": 1.08, "5": 1.15}
        }

    # Fetch and update
    for key, ticker in tickers.items():
        r1 = get_return(ticker, 1)
        r3 = get_return(ticker, 3)
        r5 = get_return(ticker, 5)
        
        if key not in data:
            data[key] = {}
            
        if r1 is not None:
            data[key]["1"] = r1
        if r3 is not None:
            data[key]["3"] = r3
        if r5 is not None:
            data[key]["5"] = r5

    # Try fetching GemelNet averages for general track
    gemel_averages = get_gemel_averages()
    if gemel_averages:
        data["general"] = gemel_averages
        print(f"Successfully scraped General Track averages: {gemel_averages}")

    # Update timestamp
    now = datetime.now()
    data["last_updated"] = now.isoformat()

    # Save JSON
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        
    # Update HTML
    html_path = os.path.join(os.path.dirname(__file__), '..', 'invest.html')
    try:
        with open(html_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
            
        import re
        date_str = now.strftime('%d.%m.%Y')
        new_text = f'(מעודכן לתאריך: {date_str})'
        # Regex to replace everything inside id="update-date-text">...<
        html_content = re.sub(
            r'(id="update-date-text">)[^<]+(</small>)',
            rf'\g<1>{new_text}\g<2>',
            html_content
        )
        
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
            
        print(f"Successfully updated HTML with date: {date_str}")
    except Exception as e:
        print(f"Error updating HTML: {e}")
        
    print(f"Successfully updated market_returns.json at {now.isoformat()}")

if __name__ == "__main__":
    main()
