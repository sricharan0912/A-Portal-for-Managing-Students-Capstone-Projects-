#!/bin/bash

echo "🚀 Deploying Capstone Hub Documentation..."

# Generate backend docs
echo "📚 Generating backend documentation..."
cd backend
npm run docs:generate
cd ..

# Generate frontend docs
echo "🎨 Generating frontend documentation..."
cd frontend
npm run docs:generate
cd ..

# Create/clear docs folder
echo "📁 Setting up unified docs folder..."
rm -rf docs
mkdir -p docs

# Copy docs
echo "📋 Copying backend docs..."
cp -r backend/docs/jsdoc docs/backend

echo "📋 Copying frontend docs..."
cp -r frontend/docs/jsdoc docs/frontend

# Create landing page
echo "🏠 Creating landing page..."
cat > docs/index.html << 'INNEREOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Capstone Hub Documentation</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 900px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 40px;
        }
        .doc-card {
            background: white;
            padding: 30px;
            margin: 20px 0;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .doc-card h2 {
            color: #667eea;
            margin-bottom: 10px;
        }
        .doc-card p {
            color: #666;
            margin-bottom: 15px;
        }
        .doc-card a {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
        }
        .doc-card a:hover {
            background: #5568d3;
        }
    </style>
</head>
<body>
    <h1>🎓 Capstone Hub Documentation</h1>
    
    <div class="doc-card">
        <h2>⚙️ Backend API Documentation</h2>
        <p>Complete REST API documentation including endpoints, controllers, middleware, and database operations.</p>
        <a href="./backend/index.html">View Backend Docs →</a>
    </div>
    
    <div class="doc-card">
        <h2>🎨 Frontend Components Documentation</h2>
        <p>React component library, custom hooks, utilities, and UI implementation details.</p>
        <a href="./frontend/index.html">View Frontend Docs →</a>
    </div>
    
    <footer style="text-align: center; margin-top: 50px; color: #666;">
        <p>Created by Sri Charan Tadiparthi, Lohith Mudipalli, Bharath Karumanchi</p>
    </footer>
</body>
</html>
INNEREOF

echo "✅ Documentation prepared in docs/ folder"
echo ""
echo "Next steps:"
echo "1. git add docs/"
echo "2. git commit -m 'Add unified documentation'"
echo "3. git push origin documentation"
