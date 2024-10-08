const mongoose = require('mongoose'); // Correctly import mongoose
const { Schema } = mongoose; // Destructure Schema from mongoose
const date = new Date()


// Define the schema
const Reply_Schema = new Schema({
    text: {type: Schema.Types.String},
    delete_password :  {type: Schema.Types.String},
    created_on :{type:Date , default : date},
    bumped_on : {type:Date , default : date} ,
    reported : {type : Boolean , default : false}
});

const Thread_Schema = new Schema({
    text: {type: Schema.Types.String},
    created_on :{type:Date , default : date},
    bumped_on : {type:Date , default : date} ,
    reported : {type : Boolean , default : false},
    delete_password :  {type: Schema.Types.String},
    replies : {type : [Reply_Schema],default: [] }
    
});

const Board_Schema = new Schema({
    name : {type: Schema.Types.String},
    threads  : {type: [Thread_Schema],default: [] }
});
// Create the model
const reply = mongoose.model("reply",Reply_Schema)
const thread = mongoose.model("thread",Thread_Schema)
const board = mongoose.model("Board", Board_Schema); 

// Export the model
module.exports = {
    reply,
    thread,
    board
};