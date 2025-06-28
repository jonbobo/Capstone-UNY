import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import time
import os
import json
import re
from collections import deque, defaultdict
from datetime import datetime

class HunterProgramAdvisor:
    def __init__(self, max_pages=150, delay=1.5):
        """
        Initialize the Hunter College Programs & Majors Advisor
        
        Args:
            max_pages: Maximum number of pages to crawl
            delay: Delay between requests (seconds) to be respectful
        """
        self.base_url = "https://hunter.cuny.edu"
        self.max_pages = max_pages
        self.delay = delay
        self.visited_urls = set()
        self.to_visit = deque()
        
        # Knowledge base focused only on academic programs
        self.knowledge_base = {
            'undergraduate_programs': {},
            'graduate_programs': {},
            'certificate_programs': {},
            'academic_pathways': {},
            'program_requirements': {},
            'schools_departments': {}
        }
        
        self.page_count = 0
        self.base_domain = "hunter.cuny.edu"
        
        # Priority URLs - ONLY academic program related
        self.priority_urls = [
            "https://hunter.cuny.edu/academics/",
            "https://hunter.cuny.edu/academics/schools-and-departments/",
            "https://hunter.cuny.edu/academics/undergraduate/",
            "https://hunter.cuny.edu/academics/graduate/",
            "https://catalog.hunter.cuny.edu/undergraduate/",
            "https://catalog.hunter.cuny.edu/graduate/",
            "https://hunter.cuny.edu/academics/schools-and-departments/school-of-arts-and-sciences/",
            "https://hunter.cuny.edu/academics/schools-and-departments/school-of-education/",
            "https://hunter.cuny.edu/academics/schools-and-departments/hunter-college-school-of-social-work/",
            "https://hunter.cuny.edu/academics/schools-and-departments/school-of-nursing/",
            "https://hunter.cuny.edu/academics/schools-and-departments/silberman-school-of-social-work/",
            "https://hunter.cuny.edu/academics/schools-and-departments/school-of-public-health/"
        ]
        
        # Add priority URLs to crawl queue
        for url in self.priority_urls:
            self.to_visit.append(url)
    
    def is_program_related_url(self, url):
        """Check if URL is related to academic programs, majors, or pathways"""
        url_lower = url.lower()
        
        # Must be Hunter College domain
        parsed = urlparse(url)
        if parsed.netloc not in ['hunter.cuny.edu', 'catalog.hunter.cuny.edu', 'www.hunter.cuny.edu']:
            return False
        
        # Skip non-content files
        skip_extensions = ['.pdf', '.jpg', '.png', '.gif', '.css', '.js', '.ico', '.zip', '.doc', '.docx']
        if any(url_lower.endswith(ext) for ext in skip_extensions):
            return False
            
        # Skip non-content paths
        skip_paths = ['#', 'javascript:', 'mailto:', 'tel:', '/wp-admin/', '/wp-content/']
        if any(url_lower.startswith(path) for path in skip_paths):
            return False
        
        # ONLY allow program-related URLs
        program_keywords = [
            'academic', 'program', 'major', 'degree', 'undergraduate', 'graduate', 
            'bachelor', 'master', 'doctorate', 'phd', 'certificate', 'minor',
            'school', 'department', 'curriculum', 'pathway', 'concentration',
            'catalog', 'course', 'requirement'
        ]
        
        # Must contain at least one program-related keyword
        if not any(keyword in url_lower for keyword in program_keywords):
            return False
        
        # Exclude non-academic pages even if they contain keywords
        exclude_keywords = [
            'news', 'event', 'calendar', 'contact', 'about', 'staff', 'faculty-profile',
            'student-life', 'campus', 'library', 'dining', 'housing', 'parking',
            'career-services', 'health', 'wellness', 'financial-aid', 'tuition',
            'application', 'admission', 'apply', 'visit', 'tour', 'media'
        ]
        
        if any(keyword in url_lower for keyword in exclude_keywords):
            return False
            
        return True
    
    def categorize_program_url(self, url):
        """Categorize URL based on program type"""
        url_lower = url.lower()
        
        if any(keyword in url_lower for keyword in ['undergraduate', 'bachelor', 'ba', 'bs']):
            return 'undergraduate_programs'
        elif any(keyword in url_lower for keyword in ['graduate', 'master', 'ma', 'ms', 'mfa', 'phd', 'doctorate']):
            return 'graduate_programs'
        elif any(keyword in url_lower for keyword in ['certificate', 'certification']):
            return 'certificate_programs'
        elif any(keyword in url_lower for keyword in ['pathway', 'track', 'concentration', 'specialization']):
            return 'academic_pathways'
        elif any(keyword in url_lower for keyword in ['requirement', 'prerequisite', 'credit', 'curriculum']):
            return 'program_requirements'
        elif any(keyword in url_lower for keyword in ['school', 'department']):
            return 'schools_departments'
        else:
            return 'undergraduate_programs'  # Default category
    
    def extract_program_data(self, soup, url, category):
        """Extract program-specific data from web pages"""
        data = {
            'url': url,
            'title': '',
            'content': '',
            'program_info': {},
            'category': category
        }
        
        # Extract title
        title_tag = soup.find('title')
        if title_tag:
            data['title'] = title_tag.get_text().strip()
        
        # Remove unwanted elements
        for element in soup(['script', 'style', 'nav', 'footer', 'header', 'aside', 'form', 'iframe', 'button']):
            element.decompose()
        
        # Extract main content
        main_content = (soup.find('main') or 
                       soup.find('article') or 
                       soup.find('div', class_='content') or
                       soup.find('div', id='content') or
                       soup.find('div', class_='page-content'))
        
        if main_content:
            # Extract clean text
            text = main_content.get_text(separator='\n', strip=True)
            data['content'] = self.clean_text(text)
            
            # Extract program-specific information
            data['program_info'] = self.extract_detailed_program_info(main_content, text)
        
        return data
    
    def extract_detailed_program_info(self, content, text):
        """Extract detailed program information"""
        program_info = {}
        
        # Extract degree types
        degree_patterns = [
            r'Bachelor of Arts \(B\.?A\.?\)',
            r'Bachelor of Science \(B\.?S\.?\)',
            r'Bachelor of Fine Arts \(B\.?F\.?A\.?\)',
            r'Master of Arts \(M\.?A\.?\)',
            r'Master of Science \(M\.?S\.?\)',
            r'Master of Fine Arts \(M\.?F\.?A\.?\)',
            r'Master of Education \(M\.?Ed\.?\)',
            r'Doctor of Philosophy \(Ph\.?D\.?\)',
            r'Certificate'
        ]
        
        for pattern in degree_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                program_info['degree_type'] = matches[0]
                break
        
        # Extract credit requirements
        credit_patterns = [
            r'(\d+)\s*total\s*credits?',
            r'(\d+)\s*credits?\s*required',
            r'minimum\s*of\s*(\d+)\s*credits?',
            r'(\d+)\s*credit\s*hours?'
        ]
        
        for pattern in credit_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                program_info['total_credits'] = int(matches[0])
                break
        
        # Extract GPA requirements
        gpa_matches = re.findall(r'GPA[:\s]*(\d+\.?\d*)', text, re.IGNORECASE)
        if gpa_matches:
            program_info['gpa_requirement'] = float(gpa_matches[0])
        
        # Extract major concentrations/tracks
        concentration_patterns = [
            r'concentrations?[:\s]*([^\n]*)',
            r'tracks?[:\s]*([^\n]*)',
            r'specializations?[:\s]*([^\n]*)'
        ]
        
        for pattern in concentration_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                program_info['concentrations'] = [c.strip() for c in matches[0].split(',')]
                break
        
        # Extract course requirements or core courses
        if any(keyword in text.lower() for keyword in ['core courses', 'required courses', 'curriculum']):
            # Look for course codes (e.g., MATH 101, ENGL 120)
            course_codes = re.findall(r'([A-Z]{2,4}\s*\d{3,4}[A-Z]?)', text)
            if course_codes:
                program_info['sample_courses'] = list(set(course_codes[:10]))  # Limit to 10 courses
        
        # Extract department information
        dept_matches = re.search(r'Department of ([^.\n]*)', text, re.IGNORECASE)
        if dept_matches:
            program_info['department'] = dept_matches.group(1).strip()
        
        # Extract program description (first substantial paragraph)
        paragraphs = [p.strip() for p in text.split('\n') if len(p.strip()) > 100]
        if paragraphs:
            program_info['description'] = paragraphs[0][:500] + "..." if len(paragraphs[0]) > 500 else paragraphs[0]
        
        return program_info
    
    def clean_text(self, text):
        """Clean and normalize text"""
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        text = '\n'.join(lines)
        
        # Remove invisible characters
        invisible_chars = ['\u200b', '\u200c', '\u200d', '\ufeff']
        for char in invisible_chars:
            text = text.replace(char, '')
        
        return text
    
    def crawl_hunter_programs(self):
        """Main crawling function for Hunter College programs"""
        print(f"🎓 Starting Hunter College Programs & Majors data collection...")
        print(f"📚 Focus: Academic Programs, Majors, and Pathways ONLY")
        print(f"Max pages: {self.max_pages}, Delay: {self.delay}s")
        
        session = requests.Session()
        session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
        })
        
        while self.to_visit and self.page_count < self.max_pages:
            current_url = self.to_visit.popleft()
            
            if current_url in self.visited_urls:
                continue
                
            try:
                print(f"Crawling page {self.page_count + 1}: {current_url}")
                
                response = session.get(current_url, timeout=30)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Categorize and extract program data
                category = self.categorize_program_url(current_url)
                page_data = self.extract_program_data(soup, current_url, category)
                
                # Store in knowledge base only if it contains program info
                if page_data['content'] and len(page_data['content']) > 200:
                    page_id = f"page_{self.page_count}"
                    self.knowledge_base[category][page_id] = page_data
                    print(f"Stored program data in category: {category}")
                
                # Find new program-related links
                new_links = self.extract_program_links(soup, current_url)
                for link in new_links[:8]:  # Limit links per page
                    if link not in self.visited_urls:
                        self.to_visit.append(link)
                
                self.visited_urls.add(current_url)
                self.page_count += 1
                
                time.sleep(self.delay)
                
            except Exception as e:
                print(f"Error crawling {current_url}: {e}")
                continue
        
        print(f"\nProgram data collection completed! Crawled {self.page_count} pages.")
        self.print_program_summary()
        return self.knowledge_base
    
    def extract_program_links(self, soup, current_url):
        """Extract only program-related links from the current page"""
        links = []
        for link in soup.find_all('a', href=True):
            href = link['href']
            full_url = urljoin(current_url, href)
            
            if self.is_program_related_url(full_url) and full_url not in self.visited_urls:
                links.append(full_url)
        
        return links
    
    def print_program_summary(self):
        """Print summary of collected program knowledge"""
        print("\n" + "="*60)
        print("HUNTER COLLEGE PROGRAMS KNOWLEDGE BASE SUMMARY")
        print("="*60)
        
        category_names = {
            'undergraduate_programs': 'Undergraduate Programs',
            'graduate_programs': 'Graduate Programs', 
            'certificate_programs': 'Certificate Programs',
            'academic_pathways': 'Academic Pathways',
            'program_requirements': 'Program Requirements',
            'schools_departments': 'Schools & Departments'
        }
        
        for category, data in self.knowledge_base.items():
            if data:
                print(f"{category_names[category]}: {len(data)} pages")
        
        total_pages = sum(len(data) for data in self.knowledge_base.values())
        print(f"\nTotal program pages collected: {total_pages}")
    
    def save_program_knowledge(self, filename="hunter_programs_knowledge.json"):
        """Save program knowledge base to JSON file"""
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(self.knowledge_base, f, indent=2, ensure_ascii=False)
            print(f"\nProgram knowledge base saved to {filename}")
        except Exception as e:
            print(f"Error saving knowledge base: {e}")
    
    def load_program_knowledge(self, filename="hunter_programs_knowledge.json"):
        """Load program knowledge base from JSON file"""
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                self.knowledge_base = json.load(f)
            print(f"Program knowledge base loaded from {filename}")
        except Exception as e:
            print(f"Error loading knowledge base: {e}")
    
    def search_programs(self, query, category=None):
        """Search through the program knowledge base"""
        query_lower = query.lower()
        results = []
        
        categories_to_search = [category] if category else self.knowledge_base.keys()
        
        for cat in categories_to_search:
            for page_id, page_data in self.knowledge_base.get(cat, {}).items():
                # Search in title, content, and program info
                if (query_lower in page_data.get('title', '').lower() or 
                    query_lower in page_data.get('content', '').lower() or
                    self.search_program_info(query_lower, page_data.get('program_info', {}))):
                    
                    results.append({
                        'category': cat,
                        'title': page_data.get('title', ''),
                        'url': page_data.get('url', ''),
                        'program_info': page_data.get('program_info', {}),
                        'relevance_score': self.calculate_program_relevance(query_lower, page_data)
                    })
        
        # Sort by relevance
        results.sort(key=lambda x: x['relevance_score'], reverse=True)
        return results[:8]  # Return top 8 results
    
    def search_program_info(self, query, program_info):
        """Search within program info fields"""
        search_fields = ['degree_type', 'department', 'description', 'concentrations']
        for field in search_fields:
            if field in program_info:
                value = str(program_info[field]).lower()
                if query in value:
                    return True
        return False
    
    def calculate_program_relevance(self, query, page_data):
        """Calculate relevance score for program search results"""
        score = 0
        title = page_data.get('title', '').lower()
        content = page_data.get('content', '').lower()
        program_info = page_data.get('program_info', {})
        
        # Title matches are most important
        if query in title:
            score += 15
        
        # Program info matches are very important
        if self.search_program_info(query, program_info):
            score += 10
        
        # Content matches
        score += content.count(query) * 2
        
        # Exact phrase bonus
        if query in content:
            score += 5
        
        return score
    
    def get_program_advice(self, student_question):
        """Generate program advice based on knowledge base"""
        search_results = self.search_programs(student_question)
        
        if not search_results:
            return self.generate_program_fallback_response(student_question)
        
        response = f"Here's what I found about programs and majors at Hunter College related to '{student_question}':\n\n"
        
        for i, result in enumerate(search_results[:4], 1):  # Top 4 results
            response += f"{i}. **{result['title']}**\n"
            
            # Add program details if available
            program_info = result.get('program_info', {})
            if program_info:
                if 'degree_type' in program_info:
                    response += f"Degree: {program_info['degree_type']}\n"
                if 'total_credits' in program_info:
                    response += f"Credits Required: {program_info['total_credits']}\n"
                if 'department' in program_info:
                    response += f"Department: {program_info['department']}\n"
                if 'concentrations' in program_info and len(program_info['concentrations']) > 0:
                    concentrations = ", ".join(program_info['concentrations'][:3])
                    response += f"Concentrations: {concentrations}\n"
            
            response += f"More info: {result['url']}\n\n"
        
        response += "**Need more details?** Visit the specific program pages linked above or browse all programs at hunter.cuny.edu/academics/"
        
        return response
    
    def generate_program_fallback_response(self, question):
        """Generate fallback response focused only on programs"""
        question_lower = question.lower()
        
        if any(word in question_lower for word in ['undergraduate', 'bachelor', 'ba', 'bs']):
            return ("Hunter College offers many undergraduate programs! Here are the main categories:\n\n"
                   "**Liberal Arts & Sciences**: English, History, Psychology, Biology, Chemistry, etc.\n"
                   "**Fine Arts**: Art, Music, Theatre, Film & Media Studies\n"
                   "**STEM Programs**: Computer Science, Mathematics, Physics, Environmental Science\n"
                   "**Health Sciences**: Nursing, Public Health, Nutrition\n"
                   "**Education**: Teacher preparation programs\n\n"
                   "Visit hunter.cuny.edu/academics/undergraduate/ to explore all undergraduate majors!")
        
        elif any(word in question_lower for word in ['graduate', 'master', 'phd', 'doctorate']):
            return ("Hunter College offers excellent graduate programs including:\n\n"
                   "**Master's Programs**: Over 50 master's degree options\n"
                   "**Doctoral Programs**: PhD programs in various fields\n"
                   "**Professional Programs**: MFA, MSW, and specialized degrees\n"
                   "**Health Sciences**: Advanced nursing, public health programs\n\n"
                   "Visit hunter.cuny.edu/academics/graduate/ to explore all graduate programs!")
        
        elif any(word in question_lower for word in ['certificate', 'certification']):
            return ("Hunter College offers various certificate programs for professional development:\n\n"
                   "**Professional Certificates**: Career-focused programs\n"
                   "**Post-Baccalaureate Certificates**: Advanced study options\n"
                   "**Teaching Certificates**: Education certification programs\n\n"
                   "Check the academic catalog for current certificate offerings!")
        
        elif any(word in question_lower for word in ['requirement', 'credit', 'prerequisite']):
            return ("Program requirements vary by major at Hunter College:\n\n"
                   "**General Education**: Core requirements for all students\n"
                   "**Major Requirements**: Specific courses for your chosen program\n"
                   "**Credit Requirements**: Typically 120 credits for bachelor's degree\n"
                   "**Prerequisites**: Foundational courses needed for advanced classes\n\n"
                   "Check the specific program pages or academic catalog for detailed requirements!")
        
        else:
            return ("I specialize in Hunter College's academic programs and majors! I can help you with:\n\n"
                   "**Undergraduate Programs**: Bachelor's degrees and majors\n"
                   "**Graduate Programs**: Master's and doctoral programs\n"
                   "**Certificate Programs**: Professional certifications\n"
                   "**Program Requirements**: Credits, prerequisites, concentrations\n"
                   "**Academic Pathways**: How to plan your studies\n\n"
                   "Ask me about any specific program, major, or academic pathway at Hunter College!")

class HunterProgramChatBot:
    """Interactive chatbot focused exclusively on Hunter College programs and majors"""
    
    def __init__(self, advisor):
        self.advisor = advisor
        self.conversation_history = []
    
    def start_program_chat(self):
        """Start interactive chat session focused on programs"""
        print("\n" + "="*70)
        print("HUNTER COLLEGE PROGRAMS & MAJORS ADVISOR 🎓")
        print("="*70)
        print("Hello! I'm your Hunter College Programs & Majors specialist.")
        print("I can help you explore:")
        print("• Undergraduate majors and programs")
        print("• Graduate programs (Master's & PhD)")
        print("• Certificate programs")
        print("• Program requirements and prerequisites")
        print("• Academic pathways and concentrations")
        print("• Specific program details and curriculum")
        print("\nType 'quit' to exit the chat.")
        print("-"*70)
        
        while True:
            try:
                user_input = input("\nAsk about programs/majors: ").strip()
                
                if user_input.lower() in ['quit', 'exit', 'bye']:
                    print("\nThank you for exploring Hunter College programs!")
                    print("Good luck choosing your academic path!")
                    break
                
                if not user_input:
                    continue
                
                # Check if question is program-related
                if not self.is_program_question(user_input):
                    print("\nI specialize only in Hunter College's academic programs and majors.")
                    print("Please ask about undergraduate programs, graduate programs, majors, or academic pathways.")
                    continue
                
                # Add to conversation history
                self.conversation_history.append(('user', user_input))
                
                # Generate response
                print("\nPrograms Advisor:")
                response = self.advisor.get_program_advice(user_input)
                print(response)
                
                # Add response to history
                self.conversation_history.append(('advisor', response))
                
            except KeyboardInterrupt:
                print("\n\nChat session ended. Explore your academic future at Hunter! 🎓")
                break
            except Exception as e:
                print(f"\nSorry, I encountered an error: {e}")
                print("Please try asking about programs or majors again.")
    
    def is_program_question(self, question):
        """Check if the question is related to programs/majors"""
        program_keywords = [
            'program', 'major', 'degree', 'undergraduate', 'graduate', 'bachelor', 'master',
            'phd', 'doctorate', 'certificate', 'minor', 'concentration', 'track', 'pathway',
            'curriculum', 'course', 'requirement', 'prerequisite', 'credit', 'department',
            'school', 'study', 'academic', 'education', 'learning', 'subject', 'field'
        ]
        
        question_lower = question.lower()
        return any(keyword in question_lower for keyword in program_keywords)

# Main Functions

def setup_hunter_program_advisor():
    """Set up the Hunter College Program Advisor with fresh data"""
    print("Setting up Hunter College Programs & Majors Advisor...")
    
    advisor = HunterProgramAdvisor(max_pages=120, delay=2)
    
    # Crawl Hunter College programs
    knowledge_base = advisor.crawl_hunter_programs()
    
    # Save knowledge base
    advisor.save_program_knowledge()
    
    return advisor

def load_existing_program_advisor():
    """Load advisor with existing program knowledge base"""
    advisor = HunterProgramAdvisor()
    advisor.load_program_knowledge()
    return advisor

def demo_program_queries():
    """Demonstrate advisor capabilities with program-focused queries"""
    advisor = load_existing_program_advisor()
    
    sample_questions = [
        "What computer science programs does Hunter offer?",
        "Tell me about undergraduate psychology majors",
        "What are the requirements for the nursing program?",
        "What graduate programs are available in education?",
        "Does Hunter have art programs?",
        "What certificate programs can I take?"
    ]
    
    print("\n" + "="*60)
    print("DEMO: HUNTER COLLEGE PROGRAMS ADVISOR")
    print("="*60)
    
    for question in sample_questions:
        print(f"\nQuestion: {question}")
        print("Programs Advisor:")
        response = advisor.get_program_advice(question)
        print(response)
        print("-" * 60)

if __name__ == "__main__":
    # Load or create program advisor
    try:
        advisor = load_existing_program_advisor()
        print("Loaded existing Hunter College programs knowledge base")
    except:
        print("No existing knowledge base found. Setting up fresh advisor...")
        advisor = setup_hunter_program_advisor()
    
    # Start the programs-focused chatbot
    chatbot = HunterProgramChatBot(advisor)
    chatbot.start_program_chat()

# Additional utility functions for programs only

def search_specific_program(program_name):
    """Search for a specific program"""
    advisor = load_existing_program_advisor()
    results = advisor.search_programs(program_name)
    
    print(f"\nSearch results for '{program_name}' programs:")
    print("="*60)
    
    if not results:
        print("No programs found matching your search.")
        return
    
    for i, result in enumerate(results, 1):
        print(f"{i}. {result['title']}")
        print(f"   Category: {result['category'].replace('_', ' ').title()}")
        program_info = result.get('program_info', {})
        if 'degree_type' in program_info:
            print(f"   Degree: {program_info['degree_type']}")
        if 'total_credits' in program_info:
            print(f"   Credits: {program_info['total_credits']}")
        print(f"   URL: {result['url']}")
        print()

# Example: search_specific_program("computer science")