import sys
import json
import os
from pathlib import Path

# Add the chatbot directory to Python path
chatbot_dir = Path(__file__).parent.parent / "chatbot"
sys.path.append(str(chatbot_dir))

try:
    from hunter_ai import get_database, UNYCompassBot
except ImportError as e:
    print(json.dumps({"error": f"Failed to import hunter_ai: {e}"}))
    sys.exit(1)

def initialize_chatbot():
    """Initialize the chatbot and database"""
    try:
        db = get_database()
        if not db or not db.chunks:
            return None, "Database not found or empty. Please run the web crawler first."
        
        bot = UNYCompassBot(db)
        return bot, None
    except Exception as e:
        return None, f"Error initializing chatbot: {str(e)}"

def ask_question(question):
    """Ask a question to the chatbot and return the response"""
    if not question or not question.strip():
        return {"error": "Question cannot be empty"}
    
    try:
        bot, error = initialize_chatbot()
        if error:
            return {"error": error}
        
        # Get the answer from the chatbot
        answer = bot.answer_question(question.strip())
        
        return {
            "success": True,
            "question": question,
            "answer": answer,
            "timestamp": str(os.times())
        }
        
    except Exception as e:
        return {"error": f"Error processing question: {str(e)}"}

def main():
    """Main function that handles command line arguments"""
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No question provided"}))
        sys.exit(1)
    
    # Get the question from command line argument
    question = sys.argv[1]
    
    # Process the question and return JSON response
    response = ask_question(question)
    print(json.dumps(response))

if __name__ == "__main__":
    main()