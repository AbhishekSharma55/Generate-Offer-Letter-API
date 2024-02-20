// Constant Variables
const express = require('express');
const session = require('express-session');
const getdata = require('./Fetch_data');
const path = require('path');
const compression = require('compression'); // Added compression middleware
const puppeteer = require('puppeteer');
const fs = require('fs');
const mongoose = require('mongoose');

// Connect to the database
mongoose.connect('mongodb://127.0.0.1:27017/Test_DB');
const db = mongoose.connection;

// Define Mongoose Schemas
const offerletterSchema = new mongoose.Schema({
  sno: Number,
  name: String,
  role: String,
  from: String,
  to: String,
  email: String,
  referenceno: String,
  pdf: {
    data: Buffer,
    contentType: String,
  },
});

const loginSchema = new mongoose.Schema({
  email: String,
  password: String,
});



// Create Mongoose Models
const Employe = mongoose.model('Employe', offerletterSchema);
const logins = mongoose.model('Logindata', loginSchema);

// App usage
const app = express();
app.use(compression()); // Enable compression
app.use('/static', express.static('static', { maxAge: 31536000 }));
app.use(express.urlencoded());
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 30 * 60 * 1000 },
}));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to check if the user is logged in
const requireLogin = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
};

// Get Requests
app.get('/', (req, res) => {
  const error = req.query.error || null;
  res.render('login', { error });
});

app.get('/login', (req, res) => {
  const error = req.query.error || null;
  res.render('login', { error });
});

app.get('/Home', requireLogin, async (req, res) => {
  try {
    const page = 1;
    const RESULTS_PER_PAGE = 10;
    const skip = (page - 1) * RESULTS_PER_PAGE;
    const data = await Employe
      .find({})
      .sort({ sno: -1 })
      .skip(skip)
      .limit(RESULTS_PER_PAGE);
    res.render('main.ejs', { data, notification: 'Logged in Succesfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/secure-route', requireLogin, (req, res) => {
  res.send('This is a secure route');
});

app.get('/Generate-Certificate', requireLogin, async (req, res) => {
  try {
    // Find the latest employee to get the latest reference number
    const latestEmployee = await Employe.findOne().sort({ sno: -1 });
    const nextSno = latestEmployee ? latestEmployee.sno + 1 : 1;

    // Generate the reference number based on the nextSno
    const referenceno = 'REF' + nextSno.toString().padStart(4, '0'); // Assuming reference numbers start with "REF" followed by 4 digits

    // Render the certificate.ejs template with the reference number
    res.render('certificate.ejs', { referenceno });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});


// Post Requests
app.post('/submitform', requireLogin, async (req, res) => {
  try {
    const { name, jobRole, joiningDate, endingDate, email} = req.body;
    // Find the latest employee to get the latest reference number
    const latestEmployee = await Employe.findOne().sort({ sno: -1 });
    const nextSno = latestEmployee ? latestEmployee.sno + 1 : 1;

    // Generate the reference number based on the nextSno
    const referenceno = 'REF' + nextSno.toString().padStart(4, '0'); // 
    const template = fs.readFileSync(__dirname + '/static/Template/template.html', 'utf-8');
    const offerLetter = template
      .replace('{{name}}', name)
      .replace('{{position}}', jobRole)
      .replace('{{joining_data}}', joiningDate)
      .replace('{{ending_data}}', endingDate)
      .replace('{{reference}}', referenceno);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(offerLetter, { waitUntil: 'domcontentloaded' });
    const pdfBuffer = await page.pdf();
    await browser.close();

    await savePdfToDatabase({ name, jobRole, joiningDate, endingDate, email, referenceno, sno: nextSno }, pdfBuffer);

    const data = await getdata(Employe);

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      res.json({ success: true, data });
    } else {
      const page = 1;
      const RESULTS_PER_PAGE = 10;
      const skip = (page - 1) * RESULTS_PER_PAGE;
      const data = await Employe
        .find({})
        .sort({ sno: -1 })
        .skip(skip)
        .limit(RESULTS_PER_PAGE);
      res.render('main.ejs', { data, notification: 'Data Added Succesfully!' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});
app.get('/update/:employeeId', async (req, res) => {
  try {
    let employeeId = req.params.employeeId;
    // Trim the employeeId to remove any additional characters
    employeeId = employeeId.substring(0, 24);
    const employee = await Employe.findById(employeeId);
    if (!employee) {
      return res.status(404).send('Employee not found');
    }
    res.render('update.ejs', { employee });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/update-employee/:employeeId', requireLogin, async (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    const { name, role, from, to, email, referenceno } = req.body;

    await Employe.findByIdAndUpdate(employeeId, {
      name,
      role,
      from,
      to,
      email,
      referenceno
    });
    const page = 1;
    const RESULTS_PER_PAGE = 10;
    const skip = (page - 1) * RESULTS_PER_PAGE;
    const data = await Employe
      .find({})
      .sort({ sno: -1 })
      .skip(skip)
      .limit(RESULTS_PER_PAGE);
    res.render('main.ejs', { data, notification: 'Data Deleted Succesfully!' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.post('/login', async (req, res) => {
  try {
    const { name, password } = req.body;
    const user = await logins.findOne({ email: name, password });

    if (user) {
      req.session.user = user;
      res.redirect('/Home');
    } else {
      res.redirect('/login?error=Invalid email or password');
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// ... (other routes and functions)

async function savePdfToDatabase(formData, pdfBuffer) {
  const employee = new Employe({
    sno: formData.sno,
    name: formData.name,
    role: formData.jobRole,
    from: formData.joiningDate,
    to: formData.endingDate,
    email: formData.email,
    referenceno: formData.referenceno,
    pdf: {
      data: pdfBuffer,
      contentType: 'application/pdf',
    },
  });

  await employee.save();
}
app.get('/delete/:employeeId', requireLogin, async (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    console.log("Data deleted success")
    const employee = await Employe.deleteOne({ _id: employeeId });
    res.render('main.ejs', { employee, notification: 'Data has been Deleted' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});
app.get('/download/:employeeId', async (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    const employee = await Employe.findById(employeeId);

    if (!employee || !employee.pdf) {
      res.status(404).send('Employee or PDF not found.');
      return;
    }

    res.set('Content-Type', employee.pdf.contentType);
    res.set('Content-Disposition', 'attachment; filename=offer-letter.pdf');
    res.send(employee.pdf.data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/search', async (req, res) => {
  try {
    const searchName = req.body.searchName;
    const searchData = await Employe.find({ name: { $regex: new RegExp(searchName, 'i') } });
    res.json({ success: true, data: searchData });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

app.get('/dynamic-search', async (req, res) => {
  try {
    const searchName = req.query.name;
    const page = req.query.page || 1;
    const RESULTS_PER_PAGE = 10;
    const skip = (page - 1) * RESULTS_PER_PAGE;
    const searchData = await Employe
      .find({ name: { $regex: new RegExp(searchName, 'i') } })
      .sort({ sno: -1 })
      .skip(skip)
      .limit(RESULTS_PER_PAGE);

    res.json(searchData);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/search-results', async (req, res) => {
  try {
    const searchName = req.query.name;
    const searchData = await Employe.find({ name: { $regex: new RegExp(searchName, 'i') } });
    res.render('main.ejs', { data: searchData, searchName });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Page not found
app.use((req, res) => {
  res.status(404).send("404 page not found! ayila , jadu");
});

// Debugging
const port = 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});