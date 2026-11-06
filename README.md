# 🔍 ReFind AI – Smart Lost & Found Management System

**ReFind AI** is an AI-powered Lost & Found web application designed to help people report, search, and recover lost belongings easily.

The platform connects people who have lost items with people who have found them. It uses smart item matching, image comparison, and location details to help identify potential matches.

## 🚀 Project Overview

Losing personal belongings in public places such as bus stands can be stressful. Traditional lost-and-found systems often depend on manual searching and communication.

ReFind AI provides a centralized digital platform where users can report lost and found items, view reports shared by other users, and discover potential matches.

## ✨ Key Features

- **User Authentication:** Login and registration system.
- **Report Lost Items:** Submit details and photos of lost belongings.
- **Report Found Items:** Upload information about items found by users.
- **AI-Based Image Matching:** Compare lost and found item images to identify potential matches.
- **Smart Matching:** Analyze item names, brands, categories, colors, and other details.
- **GPS Location:** Capture the user's geographical coordinates.
- **Voice-to-Text Input:** Describe an item using voice input.
- **Shared Reports:** Make lost and found reports visible to all users.
- **Dashboard:** View reports, matches, and activity statistics.
- **Photo Upload and Camera:** Upload an existing image or capture a new one.
- **Match Alerts:** Help users identify possible matches.

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| HTML5 | Web page structure |
| CSS3 | Styling and responsive design |
| JavaScript | Frontend functionality |
| Node.js | Backend runtime |
| Express.js | REST API development |
| SQLite | Database management |
| Python | AI service |
| FastAPI | AI service API |
| Hugging Face CLIP | Image similarity comparison |
| Git & GitHub | Version control |

## 🧠 How It Works

1. A user registers or logs into ReFind AI.
2. The user reports a lost or found item.
3. The user adds item details, a photograph, and location information.
4. The backend stores the report in the database.
5. The matching system compares lost and found reports.
6. The AI image comparison service helps identify visually similar items.
7. Potential matches are displayed on the dashboard.

## 📁 Project Structure

```text
ReFind-AI/
│
├── frontend/
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── style.css
│   └── app.js
│
├── backend/
│   ├── server.js
│   └── package.json
│
├── ai-service/
│   ├── app.py
│   └── requirements.txt
│
└── README.md
```

*Note: Update the folder structure above if your actual repository uses a different arrangement.*

## ⚙️ Installation and Setup

### 1. Clone the Repository


git clone YOUR_GITHUB_REPOSITORY_URL
cd ReFind-AI


### 2. Start the Node.js Backend


cd backend
npm install
node server.js


The backend runs on:


http://localhost:5000


### 3. Set Up the AI Service

Open a new terminal:


cd ai-service
pip install -r requirements.txt
uvicorn app:app --reload --port 8000


The AI service runs on:


http://localhost:8000


### 4. Run the Frontend

Open the frontend folder in Visual Studio Code and launch `login.html` using the **Live Server** extension.

Make sure both backend services are running before testing features that require APIs.

## 🎯 Project Objectives

- To provide a centralized platform for lost-and-found reporting.
- To reduce the time required to recover lost belongings.
- To use AI-based image comparison for identifying potential matches.
- To improve communication between people who lose and find items.
- To make the lost-and-found process smarter and more accessible.

## 🌟 What Makes ReFind AI Unique?

Unlike traditional manual lost-and-found systems, ReFind AI combines:

- AI-powered visual similarity comparison.
- Smart matching based on item characteristics.
- Centralized reports accessible to multiple users.
- GPS-based location information.
- Voice-assisted item descriptions.

This combination aims to make finding lost belongings faster and easier.

## 🔮 Future Enhancements

- Real-time notifications for matching items.
- In-app messaging between users.
- More advanced AI matching accuracy.
- Interactive map-based item locations.
- Mobile application integration.

## 👩‍💻 Developed By

**ReFind AI – Project Team**

Third Year B.Tech – Computer Science and Engineering

Developed as an academic project to demonstrate the use of web technologies, backend development, databases, and Artificial Intelligence in 
solving real-world problems.

⭐ **If you find this project interesting, don't forget to star the repository!**
