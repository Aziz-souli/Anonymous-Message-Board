'use strict';
const { test } = require("mocha");
const { board, reply, thread } = require("../model.js");
const express = require("express");

// Create a board 
const Create_Board = async (board_name) => {
  try {
    const new_board = new board({
      name: board_name,
      threads: []
    });
    return new_board;
  } catch (err) {
    console.log(err);
    throw err; // Rethrow the error for handling in the caller
  }
}

// Create a thread 
const Create_thread = async (thread_text, delete_password) => {
  try {
    const new_thread = new thread({
      text: thread_text,
      delete_password: delete_password
    });
    return new_thread;
  } catch (err) {
    console.log(err);
    throw err; // Rethrow the error for handling in the caller
  }
}

// Create a reply 
const Reply_thread = async (reply_thread, delete_password) => {
  try {
    const new_reply = new reply({
      text: reply_thread,
      delete_password: delete_password
    });
    return new_reply;
  } catch (err) {
    console.log(err);
    throw err; // Rethrow the error for handling in the caller
  }
}

// Find a board 
const Find_Board = async (board_name) => {
  //console.log(`Find_Board boardname ${board_name}`)
  try {
    const Found_board = await board.findOne({ name: board_name });
    return Found_board;
  } catch (err) {
    console.log(err);
    return null; // Return null instead of false for better clarity
  }
}


module.exports = function (app) {
  
  app.route('/api/threads/:board')
    .post(async (req, res) => {
      //console.log(" i a m  in the threads.post")
      try {
        const { text, delete_password } = req.body; // Destructure board_name correctly
        const board_name = req.params.board;
        //console.log(` this is board name  ${board_name}`)
        
        const Found_board = await Find_Board(board_name); // Await the async function
        if (Found_board) {
          //console.log(" i a m  in the threads.post in foundboard")
          const new_thread = await Create_thread(text, delete_password); // Await creating a new thread 
          Found_board.threads.push(new_thread); // Adding the thread to the existing board 
          await Found_board.save(); // Ensure to await save
          res.status(200).send(new_thread);
         //console.log(` this new_thread if Board is Found `)
         console.log(new_thread)
        } else {
          //console.log(" i a m  in the threads.post not foundboarf")
          const new_board = await Create_Board(board_name); // Create a new board
          const new_thread = await Create_thread(text, delete_password);
          new_board.threads.push(new_thread);
          await new_board.save(); // Save the new board
          res.status(200).send(new_thread);// Send a response
          //console.log(` this new_thread if Board not Found `)
          //console.log(new_thread)
        }
      } catch (err) {
        console.error("Error creating thread:", err);
        res.status(500).send("Internal server error");
      }
    })
    .get(async (req, res) => {
      try {
        const board_name = req.params.board;
        const Found_board = await Find_Board(board_name);
    
        if (Found_board) {
          const threads = Found_board.threads.slice(-10);  // Get the last 10 threads
          // Map over each thread and remove sensitive fields like `reported` and `delete_password`
          const last_10_threads = threads.map((thread) => {
            const {
              _id,
              text,
              created_on,
              bumped_on,
              replies
            } = thread;
  
            return {
              _id,
              text,
              created_on,
              bumped_on,
              replies: replies.slice(-3).map(({ text, created_on, bumped_on }) => ({
                text,
                created_on,
                bumped_on
              })),
              replycount: replies.length  // Number of replies
            };
          });
    
          // Logging the output (can be removed or limited in production)
          
          //console.log("this is last_10_threads:");
          //console.log(last_10_threads);
    
          // Respond with the last 10 threads data
          res.json(last_10_threads);
        } else {
          res.status(404).send("Board not found");
        }
      } catch (err) {
        console.error("Error fetching threads:", err);
        res.status(500).send("Internal server error");
      }
    })
    .put(async (req, res) => {
      //console.log("i am in the put request ")
      try {
        const { thread_id } = req.body;
        const board_name = req.params.board;
        const Found_board = await Find_Board(board_name);
        if (Found_board) {
          let Found_thread = Found_board.threads.id(thread_id);
          if (Found_thread) {
            const date = new Date();
            Found_thread.reported = true;
            Found_thread.bumped_on = date;
            await Found_board.save();
            //console.log("Thread has been reported successfully");
            return res.status(200).send("reported");
          } else {
            return res.status(404).json({ message: "Thread not found" });
          }
        } else {
          return res.status(404).json({ message: "Board not found" });
        }
      } catch (err) {
        console.error("Error reporting thread:", err);
        return res.status(500).json({ message: "Internal server error" });
      }
    })
    .delete(async (req, res) => {
      //console.log(" i am in get of /api/threads ")
      try {
        const { thread_id, delete_password } = req.body;
        const board_name = req.params.board;
        const Found_board = await Find_Board(board_name);
        if (!Found_board) {
          return res.status(404).send("Board not found");
        }
        let Found_thread = Found_board.threads.id(thread_id);
        if (!Found_thread) {
          return res.status(404).send("Thread not found");
        }
        if (Found_thread.delete_password === delete_password) {
          Found_board.threads.pull(thread_id);
          await Found_board.save();
          res.status(200).send("success");
          //console.log("Thread deleted");
        } else {
          res.status(400).send("incorrect password");
          //console.log("incorrect password");
        }
      } catch (err) {
        console.error("Error deleting thread:", err);
        return res.status(500).send("Internal server error");
      }
    });

  app.route('/api/replies/:board')
    .post(async (req, res) => {
      try {
        const { thread_id, text, delete_password } = req.body;
        const board_name = req.params.board;
        const Found_board = await Find_Board(board_name);
        if (Found_board) {
          let Found_thread = Found_board.threads.id(thread_id);
          if (Found_thread) {
            const Reply = new reply({
              text: text,
              delete_password: delete_password
            });
            Found_thread.replies.push(Reply);
            await Found_board.save();
            //console.log("Reply added successfully");
            res.send(Reply);
          } else {
           //console.log("Thread not found");
            res.status(404).send("Thread not found");
          }
        } else {
          //console.log("Board not found");
          res.status(404).send("Board not found");
        }
      } catch (err) {
        console.error("Error adding reply:", err);
        res.status(500).send("Internal server error");
      }
    })
    .get(async (req, res) => {
      //console.log(" i am in the get /replies api")
      try {
        const board_name = req.params.board;
        const { thread_id } = req.query;
        
        const Found_board = await Find_Board(board_name);
        
        if (Found_board) {
          const Found_thread = Found_board.threads.id(thread_id);

          if (Found_thread){
            const thread_edited = {
              _id : Found_thread._id ,
              text : Found_thread.text,
              created_on : Found_thread.created_on,
              bumped_on:Found_thread.bumped_on,
              replies: Found_thread.replies.slice(-3).map(({ text, created_on, bumped_on }) => ({
                text,
                created_on,
                bumped_on
              })),
              replycount: Found_thread.replies.length  // Number of replies
            }
            //console.log("this is thread_edited")
            //console.log(thread_edited)
            // Respond with the found thread data
            return res.json(thread_edited);
          }
            else {
            return res.status(404).send("Thread not found");
          }
        } else {
          return res.status(404).send("Board not found");
        }
        
      } catch (err) {
        console.error("Error fetching replies:", err);
        res.status(500).send("Internal server error");
      }
    })
    .put(async (req, res) => {
      try {
        const { thread_id } = req.body;
        const board_name = req.params.board;
        const Found_board = await Find_Board(board_name);
        if (Found_board) {
          let Found_thread = Found_board.threads.id(thread_id);
          if (Found_thread) {
            let Found_reply = Found_thread.replies[0]
            if (Found_reply) {
              Found_reply.reported = true;
              Found_reply.bumped_on = new Date();
              await Found_board.save();
             //("Reply reported successfully");
              res.send("reported");
            } else {
              res.status(404).send("Reply not found");
            }
          } else {
            res.status(404).send("Thread not found");
          }
        } else {
          res.status(404).send("Board not found");
        }
      } catch (err) {
        console.error("Error reporting reply:", err);
        res.status(500).send("Internal server error");
      }
    })
    .delete(async (req, res) => {
      
      try {
        const { thread_id,delete_password } = req.body;
        const board_name = req.params.board;
        const Found_board = await Find_Board(board_name);
        if (Found_board) {
          let Found_thread = Found_board.threads.id(thread_id);
          if (Found_thread) {
            let Found_reply = Found_thread.replies[0];
            if (Found_reply) {
              if (Found_reply.delete_password === delete_password) {
                Found_reply.text = "[deleted]"
                await Found_board.save();
                res.send("success");
                console.log("Reply deleted");
              } else {
                res.status(400).send("incorrect password");
              }
            } else {
              res.status(404).send("Reply not found");
            }
          } else {
            res.status(404).send("Thread not found");
          }
        } else {
          res.status(404).send("Board not found");
        }
      } catch (err) {
        console.error("Error deleting reply:", err);
        res.status(500).send("Internal server error");
      }
    });
};
