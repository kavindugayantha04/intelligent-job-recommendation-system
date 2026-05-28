# Intelligent Job Recommendation System

An AI-powered web application designed to help candidates discover the most relevant job opportunities based on their skills, resume content, and profile information. The system uses Natural Language Processing (NLP) and Machine Learning techniques to provide intelligent job recommendations, skill gap analysis, and personalized learning suggestions.

The platform also provides recruiters with tools to manage job postings, applicants, and interview scheduling through a dedicated recruiter dashboard.

---

# 🚀 Key Features

## 👤 Candidate Features

* User Registration & Secure Login
* JWT-Based Authentication
* Upload Resume/CV
* Upload Profile Picture
* Edit Candidate Profile
* View AI-Recommended Jobs
* Apply for Jobs
* View Applied Jobs
* Skill Gap Analysis
* Personalized Course Recommendations
* AI Chatbot Assistance

---

## 🧑‍💼 Recruiter Features

* Recruiter Authentication
* Add New Job Posts
* Edit Job Details
* Delete Job Posts
* Open/Close Job Vacancies
* View Applicants
* Manage Posted Jobs
* Schedule Interviews
* View Scheduled Interviews

---

# 🤖 AI & Machine Learning Features

## ✅ Resume Skill Extraction

The system analyzes uploaded resumes and extracts relevant skills using NLP-based text preprocessing techniques.

## ✅ Intelligent Job Recommendation Engine

A Machine Learning recommendation engine compares candidate profiles with job descriptions and recommends the most suitable jobs using:

* TF-IDF Vectorization
* Cosine Similarity
* NLP Text Cleaning & Preprocessing

The recommendation model was trained using a job-related dataset and deployed as a separate Python AI microservice.

## ✅ Skill Gap Analysis

The system identifies missing skills by comparing candidate skills with required job skills.

## ✅ Course Recommendation System

Based on missing skills, the platform recommends learning resources and courses to help candidates improve their qualifications.

## ✅ AI Chatbot

A lightweight rule-based chatbot is included to assist users with common system-related questions.



---

# 🧠 AI Recommendation Architecture

## Recommendation Flow

1. Candidate uploads resume/CV
2. Resume text is cleaned and processed
3. Skills and profile information are extracted
4. Job descriptions are transformed using a trained TF-IDF model
5. Candidate profile text is transformed using the same trained model
6. Cosine similarity is calculated between candidate and job vectors
7. Jobs are ranked based on similarity score
8. Highly relevant jobs are recommended to the candidate

---

## AI Model Details

### NLP Techniques Used

* Text Cleaning
* Tokenization
* Stop Word Removal
* TF-IDF Vectorization

### Machine Learning Components

* Scikit-learn
* TfidfVectorizer
* Cosine Similarity

### Model Deployment

The trained TF-IDF vectorizer is serialized using Joblib and loaded into a dedicated Flask AI microservice for real-time recommendation processing.

---

# 🛠️ Technologies Used

## Frontend

* React.js
* Tailwind CSS
* Axios

## Backend

* Node.js
* Express.js

## Database

* MongoDB

## AI Microservice

* Python
* Flask
* Scikit-learn
* NLP Techniques

## Authentication & Security

* JWT Authentication
* bcrypt.js Password Hashing
* Protected Routes
* Role-Based Access Control

---

# 📂 Project Structure

```bash
project-root/
│
├── client/                 # React Frontend
├── server/                 # Node.js Backend API
├── ai-service/             # Python AI Recommendation Microservice
│   ├── model/              # Trained TF-IDF Model
│   ├── services/           # Recommendation Logic
│   ├── utils/              # Text Processing Utilities
│   └── app.py              # Flask API
│
├── uploads/                # Uploaded CVs & Profile Pictures
└── README.md
```

---

# ⚙️ Installation Guide

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/intelligent-job-recommendation-system.git
```

---

## 2️⃣ Navigate to the Project Directory

```bash
cd intelligent-job-recommendation-system
```

---

# 🔹 Frontend Setup

## Install Frontend Dependencies

```bash
cd client
npm install
```

## Run Frontend

```bash
npm start
```

Frontend runs on:

```bash
http://localhost:3000
```

---

# 🔹 Backend Setup

## Install Backend Dependencies

```bash
cd ../server
npm install
```

## Configure Environment Variables

Create a `.env` file inside the `server` folder:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

## Run Backend Server

```bash
npm start
```

Backend runs on:

```bash
http://localhost:5000
```

---

# 🔹 AI Service Setup

## Install AI Service Dependencies

```bash
cd ../ai-service

pip install -r requirements.txt
```

## Run AI Recommendation Service

```bash
python app.py
```

AI service runs on:

```bash
http://localhost:8000
```

---

# 🔐 Security Features

* JWT Authentication
* Password Hashing with bcrypt
* Protected API Routes
* Role-Based Authorization
* Secure File Upload Handling

---

# 📸 Main System Modules

* User Management
* Authentication System
* Profile Management
* Job Management
* AI Job Recommendation Engine
* Skill Gap Analysis
* Course Recommendation System
* Interview Scheduling System
* Recruiter Dashboard
* Candidate Dashboard
* AI Chatbot


