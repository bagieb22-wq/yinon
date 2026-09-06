import os
import json
import urllib.request

def fetch_google_reviews():
    # Credentials and configuration
    api_key = os.environ.get("GOOGLE_PLACES_API_KEY")
    # You will need to replace this with your actual Google Maps Place ID for the agency
    place_id = os.environ.get("GOOGLE_PLACE_ID", "ChIJAQAAQAAABBB") # Placeholder

    if not api_key:
        print("Error: GOOGLE_PLACES_API_KEY environment variable is missing.")
        # We don't exit with error here so the Github Action doesn't fail if key isn't set yet.
        return

    # Google Places API Details Endpoint
    # We ask for rating (overall), user_ratings_total, and reviews, in Hebrew.
    url = f"https://maps.googleapis.com/maps/api/place/details/json?place_id={place_id}&fields=name,rating,reviews,user_ratings_total&language=he&key={api_key}"

    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            
            if data.get("status") != "OK":
                print(f"API Error: {data.get('status')} - {data.get('error_message', '')}")
                return

            result = data.get("result", {})
            
            # Format the data we need for the frontend
            frontend_data = {
                "overall_rating": result.get("rating", 5.0),
                "total_reviews": result.get("user_ratings_total", 0),
                "reviews": []
            }

            for rev in result.get("reviews", []):
                frontend_data["reviews"].append({
                    "author_name": rev.get("author_name"),
                    "author_url": rev.get("author_url"),
                    "profile_photo_url": rev.get("profile_photo_url"),
                    "rating": rev.get("rating"),
                    "relative_time_description": rev.get("relative_time_description"),
                    "text": rev.get("text")
                })

            # Save to assets folder
            # The script is run from the root of the repo by GitHub Actions
            os.makedirs("assets", exist_ok=True)
            with open("assets/reviews.json", "w", encoding="utf-8") as f:
                json.dump(frontend_data, f, ensure_ascii=False, indent=2)
            
            print("Successfully updated assets/reviews.json")

    except Exception as e:
        print(f"Failed to fetch reviews: {e}")

if __name__ == "__main__":
    fetch_google_reviews()
