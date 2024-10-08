const dotenv = require('dotenv');
dotenv.config({ path: 'sample.env' }); 
const mongoose = require('mongoose')

const connectToDB = async () => {
    try {
        await mongoose.connect(process.env.DB);
        console.log("DB is connected");
    } catch (err) {
        console.error({ error: err });
    }
};

module.exports = connectToDB