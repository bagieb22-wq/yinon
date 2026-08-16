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
        return round(multiplier, 3)
    except Exception as e:
        print(f"Error fetching data for {ticker}: {e}")
        return None

def main():
    # Define tickers
    tickers = {
        'sp500': '^GSPC',
        'nasdaq': '^NDX',
        'ta125': 'TA125.TA'
    }
    
    # We will load the existing json to preserve the static tracks (general, halacha, solid)
    json_path = os.path.join(os.path.dirname(__file__), '..', 'assets', 'market_returns.json')
    
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        # Fallback if file doesn't exist
        data = {
            "sp500": {"3": 1.45, "5": 2.05},
            "nasdaq": {"3": 1.60, "5": 2.40},
            "ta125": {"3": 1.10, "5": 1.30},
            "general": {"3": 1.18, "5": 1.35},
            "halacha": {"3": 1.15, "5": 1.30},
            "solid": {"3": 1.08, "5": 1.15}
        }

    # Fetch and update
    for key, ticker in tickers.items():
        r3 = get_return(ticker, 3)
        r5 = get_return(ticker, 5)
        
        if key not in data:
            data[key] = {}
            
        if r3 is not None:
            data[key]["3"] = r3
        if r5 is not None:
            data[key]["5"] = r5

    # Update timestamp
    data["last_updated"] = datetime.now().isoformat()

    # Save
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        
    print(f"Successfully updated market_returns.json at {datetime.now().isoformat()}")

if __name__ == "__main__":
    main()
