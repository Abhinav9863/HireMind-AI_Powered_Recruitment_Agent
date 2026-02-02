import io
from pypdf import PdfReader
from typing import Tuple

def extract_text_from_pdf(file_content: bytes) -> str:
    try:
        pdf_file = io.BytesIO(file_content)
        reader = PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            text += page.extract_text()
        return text
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return ""

def validate_document_is_resume(text: str) -> Tuple[bool, str]:
    """
    Validate that the uploaded document is actually a resume/CV,
    not a ticket, receipt, invoice, or other irrelevant document.
    
    Returns:
        (is_valid, error_message)
        - (True, "") if valid resume
        - (False, "reason") if invalid
    """
    # Check minimum length
    if len(text) < 100:
        return (False, "❌ Document is not compatible. It's too short to be a valid resume. Please upload a proper CV/Resume.")
    
    # Resume indicators (at least 2 should be present)
    resume_keywords = [
        'experience', 'education', 'skills', 'work', 'employment',
        'university', 'college', 'degree', 'project', 'achievement',
        'certification', 'qualification', 'professional', 'career',
        'internship', 'training', 'developer', 'engineer', 'manager'
    ]
    
    text_lower = text.lower()
    resume_matches = sum(1 for keyword in resume_keywords if keyword in text_lower)
    
    if resume_matches < 2:
        return (False, "❌ Document is not compatible. This does not appear to be a resume. Please upload a CV/Resume with your work experience, education, and skills.")
    
    # Non-resume indicators (if 2+ present, likely not a resume)
    non_resume_keywords = [
        'ticket', 'receipt', 'invoice', 'bill', 'payment', 'transaction',
        'booking', 'reservation', 'confirmation', 'pnr', 'train', 'flight',
        'passenger', 'fare', 'amount paid', 'total amount', 'tax invoice'
    ]
    
    non_resume_matches = sum(1 for keyword in non_resume_keywords if keyword in text_lower)
    
    if non_resume_matches >= 2:
        return (False, "❌ This document is not compatible. It appears to be a ticket, receipt, or invoice - not a resume. Please upload your CV/Resume with your work experience and education.")
    
    # Additional check: Look for at least one section header pattern
    section_patterns = ['experience', 'education', 'skills', 'summary', 'objective']
    has_sections = any(pattern in text_lower for pattern in section_patterns)
    
    if not has_sections and resume_matches < 4:
        return (False, "❌ Document is not compatible. It does not contain typical resume sections (Experience, Education, Skills). Please upload a proper CV/Resume.")
    
    return (True, "")

def extract_years_of_experience(resume_text: str) -> int:
    """
    Extract total years of experience from resume text.
    
    Returns:
        Integer representing years of experience (0 if fresher/no experience found)
    """
    import re
    from datetime import datetime
    
    text_lower = resume_text.lower()
    
    # Check for fresher indicators
    fresher_keywords = ['fresher', 'recent graduate', 'no experience', 'seeking first job', 'entry level']
    if any(keyword in text_lower for keyword in fresher_keywords):
        return 0
    
    max_years = 0
    
    # Pattern 1: Explicit mentions like "5 years of experience", "3+ years"
    explicit_pattern = r'(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience|work)'
    matches = re.findall(explicit_pattern, text_lower)
    if matches:
        max_years = max(int(match) for match in matches)
    
    # Pattern 2: Date ranges (e.g., "2019 - 2023", "Jan 2018 - Dec 2021")
    # Look for year patterns
    year_range_pattern = r'(\d{4})\s*[-–—]\s*(\d{4}|present|current)'
    year_matches = re.findall(year_range_pattern, text_lower)
    
    total_experience_years = 0
    for start_year, end_year in year_matches:
        start = int(start_year)
        if 'present' in end_year or 'current' in end_year:
            end = datetime.now().year
        else:
            end = int(end_year)
        
        # Sanity check: reasonable year range
        if 1990 <= start <= datetime.now().year and start <= end <= datetime.now().year + 1:
            total_experience_years += (end - start)
    
    # Take the maximum of explicit mentions and calculated experience
    max_years = max(max_years, total_experience_years)
    
    return max_years

