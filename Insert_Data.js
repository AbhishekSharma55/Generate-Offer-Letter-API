// Import mongoose library
const mongoose = require('mongoose');
const db = mongoose.connection;
async function insert(data,Employetoadd) {
    const employeadd = new Employetoadd({
        sno: data.sno,
        name: data.name,
        role: data.jobRole,
        from: data.joiningDate,
        to: data.endingDate,
        email: data.email,
        referenceno: data.referenceno
    });
    // Log the 'name' property of the 'employeadd' instance

  employeadd.save();
};
module.exports = insert;