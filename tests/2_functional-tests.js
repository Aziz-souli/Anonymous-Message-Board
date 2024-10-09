const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const { thread } = require('../model');

chai.use(chaiHttp);

let thread_id = []
let Reply_id = []
suite('Functional Tests', function() {

// Creating a new thread: POST request to /api/threads/{board}
test('Create  new threads', function(done) {
  // First thread creation
  chai.request(server)
    .post('/api/threads/testboard')
    .send({ text: 'First test thread', delete_password: 'password123' })
    .end(function(err, res) {
      assert.equal(res.status, 200);
      assert.isObject(res.body);
      assert.property(res.body, 'text');
      assert.property(res.body, '_id');
      thread_id.push(res.body._id);  // Store the first thread ID
      //console.log(`First thread ID: ${thread_id[0]}`);
      
      // Second thread creation (inside callback of the first)
      chai.request(server)
        .post('/api/threads/testboard')
        .send({ text: 'Second test thread', delete_password: 'password456' })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isObject(res.body);
          assert.property(res.body, 'text');
          assert.property(res.body, '_id');
          thread_id.push(res.body._id);  // Store the second thread ID
          // console.log(`Second thread ID: ${thread_id[1]}`);
          done();  // Finish the test after both threads are created
        });
    });
});

// Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}
test('View 10 most recent threads with 3 replies each', function(done) {
  chai.request(server)
    .get('/api/threads/testboard')
    .end(function(err, res) {
      assert.equal(res.status, 200);
      assert.isArray(res.body);
      assert.isAtMost(res.body.length, 10); // Check that no more than 10 threads are returned
      res.body.forEach(thread => {
        assert.isArray(thread.replies);
        assert.isAtMost(thread.replies.length, 3); // Check that no more than 3 replies per thread
      });
      done();
    });
});

// Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password
test('Delete thread with incorrect password', function(done) {
  chai.request(server)
    .delete('/api/threads/testboard')
    .send({ thread_id: thread_id[0], delete_password: 'wrongpassword' })
    .end(function(err, res) {
      //console.log(res.body)
      assert.equal(res.text, 'incorrect password');
      done();
    });
});

// Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password
test('Delete thread with correct password', function(done) {
  chai.request(server)
    .delete('/api/threads/testboard')
    .send({ thread_id: thread_id[0], delete_password: 'password123' })
    .end(function(err, res) {
      assert.equal(res.status, 200);
      assert.equal(res.text, 'success');
      done();
    });
});
// Reporting a thread: PUT request to /api/threads/{board}
test('Report a thread', function(done) {
  chai.request(server)
    .put('/api/threads/testboard')
    .send({ thread_id: thread_id[1]})
    .end(function(err, res) {
      //console.log(res.body)
      assert.equal(res.status, 200);
      assert.equal(res.text, 'reported');
      done();
    });
})
// Creating a new reply: POST request to /api/replies/{board}
test('Create a new reply', function(done) {
  chai.request(server)
    .post('/api/replies/testboard')
    .send({ thread_id: thread_id[1], text: 'Test reply', delete_password: 'replypassword' })
    .end(function(err, res) {
      //console.log(res.body)
      assert.equal(res.status, 200);
      assert.isObject(res.body);
      assert.property(res.body, 'text');
      Reply_id.push( res.body._id )
    chai.request(server)
        .post('/api/replies/testboard')
        .send({ thread_id: thread_id[1], text: 'Test reply', delete_password: 'replypassword' })
        .end(function(err, res) {
          //console.log(res.body)
          assert.equal(res.status, 200);
          assert.isObject(res.body);
          assert.property(res.body, 'text');
          Reply_id.push( res.body._id )
          done();
        });
    });
});

// Viewing a single thread with all replies: GET request to /api/replies/{board}
test('View a single thread with all replies', function(done) {
  chai.request(server)
    .get(`/api/replies/testboard?thread_id=${thread_id[1]}`)
    .end(function(err, res) {
      assert.equal(res.status, 200);
      assert.isObject(res.body);
      assert.property(res.body, 'replies');
      assert.isArray(res.body.replies);
      done();
    });
});
// Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password
test('Delete reply with incorrect password', function(done) {
  chai.request(server)
    .delete('/api/replies/testboard')
    .send({thread_id : thread_id[1] ,reply_id: Reply_id[0] , delete_password: 'wrongpassword' })
    .end(function(err, res) {
      //console.log('res.body')
      //console.log(res.body)
      assert.equal(res.status, 400);
      assert.equal(res.text, 'incorrect password');
      done();
    });
});
// Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password
test('Delete reply with correct password', function(done) {
  chai.request(server)
    .delete('/api/replies/testboard')
    .send({thread_id: thread_id[1] ,reply_id: Reply_id[0], delete_password: 'replypassword' })
    .end(function(err, res) {
      assert.equal(res.status, 200);
      assert.equal(res.text, 'success');
      done();
    });
});
// Reporting a reply: PUT request to /api/replies/{board}
test('Report a reply', function(done) {
  chai.request(server)
    .put('/api/replies/testboard')
    .send({ thread_id : thread_id[1] ,reply_id: Reply_id[1] })
    .end(function(err, res) {
      assert.equal(res.status, 200);
      assert.equal(res.text, 'reported');
      done();
    });
});
});
