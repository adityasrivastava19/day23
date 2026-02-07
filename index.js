const express = require('express');
const fs = require('fs');
const cors = require('cors');
const jwt=require('jsonwebtoken');
const jwt_secert='iamgreat';
const app = express();
app.use(express.json());
app.use(cors());
const bcrypt=require('bcryptjs');
const users=[];
const FILE = 'notes.json';
function authmiddle(req,res,next)
{
      const auth = req.headers.authorization;
      if(!auth)
      {
        return res.status(401).json({message:"acsess denied "});
      }
      const token =auth.split(" ")[1];
      jwt.verify(token,jwt_secert,(err,decoded)=>
    {
        if(err)
        {
            return res.status(401).json({message:"acsess denied "});
        }
        req.user=decoded;
        next();
    });
}
app.post('/signup',async(req,res)=>{
    const {username,password}=req.body;
    if(!username||!password)
    {
        return res.json({message:"allfeild are required"});
    }
    const user=users.find(u=>username==u.username);
    if(user)
    {
        return res.status(400).json({message:"user allready exist"});
    }
    const hpass=await bcrypt.hash(password,10);
    users.push ({
        username:username,
        password:hpass
    })
     res.json({message:"you are signed in"});
}

);
app.post('/login',async (req,res)=>
{
    const {username,password}=req.body;
    const user=users.find(u=>username===u.username);
    if(!user)
    {
        return res.status(400).json({message:"invaild credintails "});
    }
    const ismatch=await bcrypt.compare(password,user.password);
    if(!ismatch)
    {
        return res.status(400).json({message:"invaild credintails "});
    }
    const token =jwt.sign({username},jwt_secert,{expiresIn:"1m"});
    res.json({token});
});

// Read notes
function readNotes() {
    try {
        if (!fs.existsSync(FILE)) {
            fs.writeFileSync(FILE, JSON.stringify([]));
        }
        return JSON.parse(fs.readFileSync(FILE, 'utf-8'));
    } catch (error) {
        console.error('Error reading notes:', error);
        return [];
    }
}

// Write notes
function writeNotes(notes) {
    try {
        fs.writeFileSync(FILE, JSON.stringify(notes, null, 2));
    } catch (error) {
        console.error('Error writing notes:', error);
        throw error;
    }
}

// GET
app.get('/notes',authmiddle, (req, res) => {
    try {
        res.json(readNotes());
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notes' });
    }
});

// POST
app.post('/notes', authmiddle,(req, res) => {
    try {
        const { text } = req.body;

        // Validate input
        if (!text || text.trim() === '') {
            return res.status(400).json({ error: 'Note text is required' });
        }

        const notes = readNotes();
        const newNote = {
            id: Date.now(),
            text: text.trim()
        };

        notes.push(newNote);
        writeNotes(notes);
        res.json(newNote);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add note' });
    }
});

// DELETE
app.delete('/notes/:id', authmiddle,(req, res) => {
    try {
        const id = Number(req.params.id);
        
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid note ID' });
        }

        let notes = readNotes();
        const initialLength = notes.length;
        notes = notes.filter(n => n.id !== id);
        
        if (notes.length === initialLength) {
            return res.status(404).json({ error: 'Note not found' });
        }

        writeNotes(notes);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete note' });
    }
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
