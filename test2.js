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
      console.log(employeeId)
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