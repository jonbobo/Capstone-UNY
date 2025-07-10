import os
import pickle
import numpy as np
from sentence_transformers import SentenceTransformer
from langchain_openai import ChatOpenAI  
from dotenv import load_dotenv
import re

# Load env
script_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(script_dir, "..", "api", "hunter_api-key.env")
load_dotenv(dotenv_path=env_path)

class UNYCompassDatabase:
    def __init__(self, db_file='../chatbot/unycompass_vectors.pkl'):
        self.db_file = db_file
        self.model = None # load to save memory
        self.chunks = []
        self.vectors = None
        self._cache = {} 
        
        # auto-load if exists
        if os.path.exists(db_file):
            self.load_database()

    # laods ai to convert to binary, only loads when needed
    def _get_model(self):
        if self.model is None:
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
        return self.model

    def clean_text(self, text):
        return re.sub(r'\s+', ' ', text).strip()
    
    #  reads .txt form web scrape and splits to smaller chunks
    # converts each chunk to bunary and saves
    def build_database(self, content_file='../docs/hunter_content.txt'):
        if not os.path.exists(content_file):
            return False
        
        with open(content_file, 'r', encoding='utf-8') as f:
            content = f.read()

    # split content to individual pages
        pages = content.split('---- Page:')
        
        for page_idx, page in enumerate(pages):
            # skip 
            if len(page.strip()) < 100:
                continue

            page_text = self.clean_text(page)
            
            # Get URL
            url = ""
            for line in page_text.split('\n')[:3]:
                if "hunter.cuny.edu/" in line:
                    url = line.strip()
                    break

            # Chunk text
            words = page_text.split()
            for i in range(0, len(words), 200):
                chunk_text = ' '.join(words[i:i + 400])
                if len(chunk_text.strip()) > 50:
                    self.chunks.append({
                        'text': chunk_text,
                        'url': url,
                        'page_idx': page_idx
                    })

        # create vectors
        model = self._get_model()
        texts = [chunk['text'] for chunk in self.chunks]
        self.vectors = model.encode(texts)
        
        # normalize for speed
        norms = np.linalg.norm(self.vectors, axis=1, keepdims=True)
        self.vectors = self.vectors / norms

        self.save_database()
        return True
    
    # saves database content if not saved
    def save_database(self):
        with open(self.db_file, 'wb') as f:
            pickle.dump({'chunks': self.chunks, 'vectors': self.vectors}, f)

    # reads database file and loads chunks to memory
    def load_database(self):
        if not os.path.exists(self.db_file):
            return False
        
        with open(self.db_file, 'rb') as f:
            data = pickle.load(f)
        
        self.chunks = data['chunks']
        self.vectors = data['vectors']
        return True
    
    # finds relevant content using similairity comparing chunks with queries to find the most similar)
    def search(self, query, top_k=2):
        if self.vectors is None:
            return []
        
        # Check cache
        if query in self._cache:
            return self._cache[query]
        
        model = self._get_model()
        query_vec = model.encode([query])
        query_vec = query_vec / np.linalg.norm(query_vec)
        
        # fast similarity
        model = self._get_model()
        query_vec = model.encode([query])
        query_vec = query_vec / np.linalg.norm(query_vec)
        
        # calc how similar the query is to each chunk
        similarities = np.dot(query_vec, self.vectors.T)[0]
        
        # find the indices of the most similar chunks
        best_indices = np.argpartition(similarities, -top_k)[-top_k:]
        
        # sort similarity from high to low
        best_indices = best_indices[np.argsort(similarities[best_indices])[::-1]]
        
        results = []
        for idx in best_indices:
            similarity_score = similarities[idx]
            
            # filters unrelated content
            if similarity_score > 0.1:
                chunk = self.chunks[idx].copy()
                chunk['similarity'] = float(similarity_score)
                results.append(chunk)
        
        self._cache[query] = results
        return results
    
class UNYCompassBot:
    def __init__(self, vector_db):
        self.vector_db = vector_db
        self.llm = ChatOpenAI(
            model='gpt-4o-mini',
            temperature=0.3,
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )
        self._response_cache = {}
    
    # generates AI responses based on user input
    def answer_question(self, question):
        # check cache first
        if question in self._response_cache:
            return self._response_cache[question]
        
        chunks = self.vector_db.search(question)
        
        if not chunks:
            return "I don't have info on that. Ask about Hunter College programs."
        
        # build context
        context = "Hunter College Info:\n\n"
        for i, chunk in enumerate(chunks, 1):
            context += f"Source {i}: {chunk['text'][:300]}\n\n"
        
        prompt = f"""{context}

Overview: 
You are a Hunter College academic advisor. Answer the student's question using the information provided above.
Be helpful and informative. If you can, include relevant URLs from the sources. Do not respond saying "according to Hunte sources"
Treat all information from the hunter website as factual. Only cite sources from the official Hunter College website.
Only give answers that relate to Hunter College major programs or pathways. If the user asks about general subject of programs
please list the majors that relate to that subject as well as the corresponding links.

Guidelines:
- be helpful and encouraging to students
- include specific names of programs and degree types (BA, BS, MA, etc.), and requirements if needed
- ALWAYS give relevant URLS so students can check the hunter website themself
- focus on the academic programsm majors and pathways
- if asked about specifc programs (i.e. Nursing), list all related majors with the links

Ethics:
- Always answer as if givig a suggestion and not a requiremtn
- emphasize students have choices and can explore theur interests at Hunter
- encourage them to talk to offical adviros (give the advisor contact info if needed), attend infor sessions, etc.

Tone:
- be encouraging
- avoid academic jargon, you are supposed to be relatable to the student
- be conversational but also profresional
- be enthusastic about Hunte programs

Question: {question}
Answer:"""
        
        try:
            response = self.llm.invoke(prompt)
            answer = response.content.strip()
            self._response_cache[question] = answer
            return answer
        except Exception as e:
            return f"Error: {e}"

_db = None

# creates or loads database as needed
def get_database():
    global _db
    if _db is None:
        _db = UNYCompassDatabase()
        if not _db.chunks:
            _db.build_database('../docs/hunter_content.txt')
    return _db

# starts chatbot
def main():
    print("Starting Hunter advisor...")
    
    db = get_database()
    if not db:
        print("Database setup failed!")
        return
    
    bot = UNYCompassBot(db)
    print("Ready! Type 'quit' to exit.\n")
    
    while True:
        try:
            question = input("User: ").strip()
            
            if question.lower() in ['quit', 'exit']:
                break
            
            if question:
                print("Bot:", bot.answer_question(question))
                
        except KeyboardInterrupt:
            break
    
    print("Goodbye!")

if __name__ == "__main__":
    main()