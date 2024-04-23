const bodyParser = require('body-parser');
const express = require('express');
const { MongoClient } = require('mongodb');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const app = express();
const port = 3000;
const axios = require ('axios')
const cron = require ('node-cron')


const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb("Please upload only images.", false);
  }
};

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-image-${file.originalname}`);
  },
});

var uploadFile = multer({ storage: storage, fileFilter: imageFilter });

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Configure multer for file upload
const upload = multer({ dest: 'uploads/' });

// static files from the public directory
app.use(express.static('public'));

// Set up body-parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session management
app.use(session({
    secret: 'yiihdhb3992843u3hhw', // Change this to a secret string
    resave: false,
    saveUninitialized: true
}));

// MongoDB connection URI
const uri = "mongodb+srv://christophergranville2:Chris50.com@akash.ypwrnw8.mongodb.net/?retryWrites=true&w=majority&appName=Akash";

// Connect to MongoDB
const client = new MongoClient(uri);
client.connect()
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch(err => {
        console.error("Error connecting to MongoDB:", err);
    });


// Define routes
app.get('/', (req, res) => {
   
    const user = req.session.user || { email: '' }; // Get user from session or set to null if not available
    return res.render('index', { user, message: '' });
    
});


// Registration route

app.post('/register', async (req, res) => {
    try {
        
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        

        // Registration logic...
        const database = client.db("Akash");
        const collection = database.collection("users");

        const existingUser = await collection.findOne({ email: req.body.email });
        if (existingUser) {
            // If the email already exists, render the index page with an error message
            req.body.email = '';
            return res.render('index', { user: req.body, message: 'User already exists. Please log in.', messageType: 'danger' });
        }

        const registrationData = {
            fullName: req.body.fullName,
            email: req.body.email,
            password: req.body.password
        };
        if (!passwordRegex.test(req.body.password)) {
            req.body.email = ''
            return res.render('index', { user: req.body, message: 'Password must contain at least one uppercase letter and one digit  and must be at least 8 in numbers', messageType: 'danger' });
        }

        if (!emailRegex.test(req.body.email)) {
            req.body.email = ''
            return res.render('index', { user: req.body, message: 'Invalid email format.', messageType: 'danger' });
        }
        const result = await collection.insertOne(registrationData);
        console.log(`${result.insertedCount} documents were inserted with the _id: ${result.insertedId}`);

        // Set user in session upon successful registration
        req.session.user = {
            email: req.body.email
        };

        // Render the index page with a success message
        return res.render('index', { user: req.body, message: 'Successful registration!', messageType: 'success' });
        
    } catch (err) {
        console.error("Error registering user:", err);
        return res.status(500).redirect('/', { user: req.body, message: 'Registration error!', messageType: 'danger' });
    }
});


app.post('/login', async (req, res) => {
    try {
        // Login logic...
        const database = client.db("Akash");
        const collection = database.collection("users");

        const { email, password } = req.body;

        const user = await collection.findOne({ email });
        if (user === null) {
            // If the user doesn't exist or the password is incorrect, send an error message
            req.body.email = ''
            return res.render('index', {user: req.body, message: 'Invalid email', messageType: 'danger' });
        }

        if(password !== user.password){
            req.body.email = ''
            return res.render('index', {user: req.body, message: 'Invalid password', messageType: 'danger' });

        }
        
        // Set user in session upon successful login
        req.session.user = user;

        // Redirect the user to the homepage
    
        return res.redirect('/');

    } catch (err) {
        console.error("Error logging in:", err);
        return res.status(500).send('Login failed. Please try again later.');
    }
});
// claim airdrop route

// Middleware to check if the user is logged in
function isLoggedIn(req, res, next) {
    
    if (req.session.user) {
        return next();
    } else {
        res.redirect('/')    }
}
// Define a route handler for claiming the airdrop
app.post('/claim', isLoggedIn, uploadFile.single('paymentProof'), async (req, res) => {
    try {
        // claim logic...
        const database = client.db("Akash");
        const collection = database.collection("claim-airdrop");

        if (req.file == undefined) {
            return res.render('index', {user: req.session.user, message: 'please upload a proof', messageType: 'danger' })
        }


        const existingWallet = await collection.findOne({ walletAddressInput: req.body.walletinput });
        if (existingWallet !== null) {
            // If the wallet already exists, render the index page with an error message
            return res.render('index', {user: req.session.user, message: 'Wallet already registered.', messageType: 'danger' });
        }

        const walletData = {
            paymentProof: req.file.filename,
            walletAddressInput: req.body.walletinput,
            gasFee: req.body.gasfee
        };

       
        const outcome = await collection.insertOne(walletData);
        console.log(`${outcome.insertedCount} documents were inserted with the _id: ${outcome.insertedId}`);


        // Render the index page with a success message
        return res.render('index', { user: req.session.user, message: 'claim successful!', messageType: 'success' });
    } catch (err) {
        console.error("Error claiming airdrop:", err);
        return res.status(500).render('index', {user: req.session.user, message: 'airdrop claim error!', messageType: 'danger' });
    }

});

const fetchData = async () => {
    try{
        await axios.get('https://www.facebook.com')
        console.log('data fetched');

    }catch(error){
        console.error('error fetching data: ', error.message)
    }
}


// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    const cronExpression = '*/14 * * * *';

    cron.schedule(cronExpression, () => {
        console.log('fetching data')
        fetchData();
    })
    
});


