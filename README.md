# Relevance Checker

Upload a PDF or paste a URL, enter keywords, get a 0-100% "worth reading" score.

## Run backend
    cd backend
    python -m venv venv && source venv/bin/activate      # Windows: venv\Scripts\activate
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000

## Run frontend
    cd frontend
    npm install
    npm run dev        # http://localhost:5173
