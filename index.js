const express = require('express');
const session = require('express-session');
const getdata = require('./Fetch_data');
const path = require('path');
const compression = require('compression');
const puppeteer = require('puppeteer');
const randomString = require('randomstring');
const fs = require('fs');
const mongoose = require('mongoose');
const templatePath = path.join(__dirname, 'static', 'Template', 'template.html');
mongoose.connect('mongodb+srv://abhisheksharma05:QKtGs0AigQ0dX6jb@cluster0.kzmywqs.mongodb.net/Offer_Generation_DB');
const db = mongoose.connection;

const offerletterSchema = new mongoose.Schema({
  sno: Number,
  name: String,
  role: String,
  from: String,
  to: String,
  email: String,
  referenceno: String,
});

const loginSchema = new mongoose.Schema({
  email: String,
  password: String,
});

const Employe = mongoose.model('Employe', offerletterSchema);
const logins = mongoose.model('Logindata', loginSchema);

const app = express();
app.use(compression());
app.use('/static', express.static('static', { maxAge: 31536000 }));
app.use(express.urlencoded());
const secretKey = randomString.generate({
  length: 64, // Adjust the length as needed
  charset: 'alphanumeric'
});
app.use(session({
  secret: secretKey,
  resave: false,
  saveUninitialized: false,
  // Add other session options as needed
}));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const requireLogin = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
};

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
    res.render('main.ejs', { data, notification: 'Logged in Successfully!' });
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
    const latestEmployee = await Employe.findOne().sort({ sno: -1 });
    const nextSno = latestEmployee ? latestEmployee.sno + 1 : 1;
    const referenceno = 'REF' + nextSno.toString().padStart(4, '0');
    res.render('certificate.ejs', { referenceno });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/submitform', requireLogin, async (req, res) => {
  try {
    const { name, jobRole, customRole, joiningDate, endingDate, email } = req.body; // Extract customRole as well
    const latestEmployee = await Employe.findOne().sort({ sno: -1 });
    const nextSno = latestEmployee ? latestEmployee.sno + 1 : 1;
    const referenceno = 'REF' + nextSno.toString().padStart(4, '0');

    // Determine the role value based on the selected role or custom role
    let role = jobRole;
    if (jobRole === 'Other') {
      role = customRole;
    }

    // Save form data to the database
    const employee = new Employe({
      sno: nextSno,
      name: name,
      role: role, // Use the determined role value
      from: joiningDate,
      to: endingDate,
      email: email,
      referenceno: referenceno,
    });
    await employee.save();

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
      res.render('main.ejs', { data, notification: 'Data Added Successfully!' });
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
    // employeeId = employeeId.substring(0, 24);
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
    res.render('main.ejs', { data, notification: 'Data Updated Successfully!' });
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

app.get('/delete/:employeeId', requireLogin, async (req, res) => {
  try {
    const employeeId = req.params.employeeId;
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

    if (!employee) {
      res.status(404).send('Employee not found.');
      return;
    }

    const pdfContent = generatePdfContent(employee);

    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/google-chrome-stable', // Specify the Chrome executable path
    });
    const page = await browser.newPage();
    await page.setContent(pdfContent, { waitUntil: 'domcontentloaded' });
    const pdfBuffer = await page.pdf();
    await browser.close();

    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', 'attachment; filename=offer-letter.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});


function generatePdfContent(employee) {
  const template = fs.readFileSync(templatePath, 'utf-8');
  const pdfContent = template
    .replace('{{name}}', employee.name)
    .replace('{{position}}', employee.role)
    .replace('{{joining_data}}', employee.from)
    .replace('{{ending_data}}', employee.to)
    .replace('{{reference}}', employee.referenceno);
  return pdfContent;
}

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

app.use((req, res) => {
  res.status(404).send("404 page not found!");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at https://offer-letter-generate-api.onrender.com/`);
});