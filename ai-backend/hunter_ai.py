import os
import pickle # for convertiving objects to bytes 
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from langchain_openai import ChatOpenAI  
from dotenv import load_dotenv
import re

# Load environment variables
load_dotenv(dotenv_path="hunter_api-key.env")

class UNYCompassDatabase:
    """Vector database for UNY Compass data"""

    def __init__(self, db_file='unycompass_vectors.pkl'):
        self.db_file = db_file
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.chunks = []
        self.vectors = None

    def clean_text(self, text):
        """Clean and normalize text"""
        text = re.sub(r'\s+', ' ', text)
        return text.strip()
    
    def extract_page_info(self, page_text):
        """Extract basic info from page"""
        lines = page_text.split('\n')
        url = ""
        title = ""
    
        for line in lines[:3]:
            if "hunter.cuny.edu/" in line:
                url = line.strip()
                break
        
        for line in lines:
            clean_line = line.strip()
            if clean_line and len(clean_line) > 10:
                title = clean_line[:100]
                break

        return {'url': url, 'title': title}
        
    def build_database(self, content_file='hunter_content.txt'):
        """Build vector database from content file"""
        if not os.path.exists(content_file):
            print(f"Content file not found: {content_file}")
            return False
        
        print("Building database...")

        with open(content_file, 'r', encoding='utf-8') as f:
            content = f.read()

        pages = content.split('---- Page:')
        
        for page_idx, page in enumerate(pages):
            if len(page.strip()) < 100:
                continue

            page_text = self.clean_text(page)
            page_info = self.extract_page_info(page_text)

            # Split into chunks
            words = page_text.split()
            chunk_size = 500

            for i in range(0, len(words), chunk_size):
                chunk_words = words[i:i + chunk_size]
                chunk_text = ' '.join(chunk_words)

                if len(chunk_text.strip()) < 50:
                    continue

                chunk_data = {
                    'text': chunk_text,
                    'page_idx': page_idx,
                    'url': page_info['url'],
                    'title': page_info['title']
                }

                self.chunks.append(chunk_data)

        print(f'Created {len(self.chunks)} chunks')

        # Create vectors
        chunk_texts = [chunk['text'] for chunk in self.chunks]
        self.vectors = self.model.encode(chunk_texts)

        self.save_database()
        return True
    
    # func to save database
    def save_database(self):
        """Save database to file"""
        database_data = {
            'chunks': self.chunks,
            'vectors': self.vectors
        }

        with open(self.db_file, 'wb') as f:
            pickle.dump(database_data, f)

        print(f"Database saved to {self.db_file}")

    # to load the database
    def load_database(self):
        """Load existing database"""
        if not os.path.exists(self.db_file):
            return False
        
        with open(self.db_file, 'rb') as f:
            db_data = pickle.load(f)
        
        self.chunks = db_data['chunks']
        self.vectors = db_data['vectors']
        
        print(f"Database loaded: {len(self.chunks)} chunks")
        return True
    
    # func to search the database
    def search(self, query, top_k=3):
        """Search for relevant content"""
        if self.vectors is None:
            return []
        
        query_vector = self.model.encode([query])
        similarities = cosine_similarity(query_vector, self.vectors)[0]
        
        sorted_indices = np.argsort(similarities)[::-1]
        
        results = []
        for idx in sorted_indices[:top_k]:
            if similarities[idx] > 0.1:  # minimum similarity threshold
                chunk = self.chunks[idx].copy()
                chunk['similarity'] = float(similarities[idx])
                results.append(chunk)
        
        return results

class UNYCompassBot:
    """Main chatbot class"""
    
    def __init__(self, vector_db):
        self.vector_db = vector_db
        self.llm = ChatOpenAI(
            model='gpt-4o-mini',
            temperature=0.3,
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )
    
    # to format context from the hunter_content.txt
    def format_context(self, chunks):
        """Format search results for context"""
        if not chunks:
            return "No relevant content found."
        
        context = "Based on Hunter College website information:\n\n"
        
        for i, chunk in enumerate(chunks, 1):
            context += f"Source {i}:\n"
            if chunk.get('title'):
                context += f"Title: {chunk['title']}\n"
            context += f"Content: {chunk['text']}\n\n"
        
        return context
    
    # func to format how the chatbot answers questions
    def answer_question(self, question):
        """Generate answer using search results"""
        relevant_chunks = self.vector_db.search(question)
        
        if not relevant_chunks:
            return "I don't have information about that topic. Please ask about Hunter College programs or academics."
        
        context = self.format_context(relevant_chunks)
        
        prompt = f"""{context}

You are a Hunter College academic advisor. Answer the student's question using the information provided above.
Be helpful and informative. If you can, include relevant URLs from the sources.

Student Question: {question}

Answer:"""
        
        try:
            response = self.llm.invoke(prompt)
            return response.content.strip()
        except Exception as e:
            return f"Sorry, I encountered an error: {e}"

# func to setup database
def setup_database():
    """Setup the vector database"""
    vector_db = UNYCompassDatabase()
    
    if not vector_db.load_database():
        print("Building new database...")
        if not vector_db.build_database('hunter_content.txt'):
            return None
    
    return vector_db

# main func
def main():
    """Main chat function"""
    print("Setting up Hunter College advisor...")
    
    vector_db = setup_database()
    if not vector_db:
        print("Failed to setup database!")
        return
    
    bot = UNYCompassBot(vector_db)
    
    print("Hunter College Advisor ready! Type 'quit' to exit.")
    print("-" * 50)
    
    while True:
        try:
            question = input("\nUser: ").strip()
            
            if question.lower() in ['quit', 'exit']:
                print("Goodbye!")
                break
            
            if not question:
                continue
            
            print("\nUNY Compass Bot: ", end="")
            response = bot.answer_question(question)
            print(response)
            
        except KeyboardInterrupt:
            print("\nGoodbye!")
            break

if __name__ == "__main__":
    main()