const express = require("express");
const app = express();
const cors = require("cors");
const pool = require("./db");  //db.js  
const multer = require("multer"); //imgupload
const path = require('path');  //imgupload
const jwt = require('jsonwebtoken');   //login
const secretKey = 'secret_key';        //login 
const serverval = 5028; 

app.use(cors());
app.use(express.json());     //file uplpad

const bodyParser = require('body-parser');//login
app.use(bodyParser.json());               //login


///////////////////////////Login User////////////////////////////////////////

app.post('/login', async (req, res) => {
  try {
      const { username, password } = req.body;
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM login_users WHERE username=$1 AND password=$2', [username, password]);
      if (result.rows.length === 1) {
          const user = result.rows[0];

          const token = jwt.sign({ userId: user.id }, secretKey, { expiresIn: '1h' });

          res.json({ token });
      } else {
          res.status(401).json({ message: 'Invalid username or password' });
      }
      client.release();
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
  }
});

///////////////////////////ACCOUNT////////////////////////////////////////

//get all Account and Contacts
app.get("/accandcon", async (req, res) => {
  try {
    const allData = await pool.query("SELECT * FROM contacts FULL JOIN accounts ON contacts.account_id = accounts.account_id");
    console.log(allData);
    res.json(allData.rows);
  } catch (error) {
    console.error(error.message);
  }
})

//get all Account 
app.get("/accounts", async (req, res) => {
    try {
        const allData = await pool.query("SELECT * FROM accounts");
        console.log(allData);
        res.json(allData.rows);   
    } catch (err) {
        console.error(err.message);
    }
});

//create Account
app.post("/createAccount", async (req, res) => {
  try {    
    const { firstname,lastname,phone,email,address } = req.body;
    const newData = await pool.query("INSERT INTO accounts (firstname,lastname,phone,email,address) VALUES($1,$2,$3,$4,$5) RETURNING *",[firstname,lastname,phone,email,address]);
    console.log(newData)
    res.json(newData.rows[0]);
  } catch (err) {
      console.error(err.message);
  }
});

//delete a Account
app.delete("/accounts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleteData = await pool.query("DELETE FROM accounts WHERE account_id = $1", [id]);
    console.log(deleteData)
    res.json("data was deleted!");
  } catch (err) {
    console.log(err.message);
  }
});

//update a Account
app.put("/updateaccount/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { firstname,lastname,phone,email,address } = req.body;
    const updateData = await pool.query("UPDATE accounts SET firstname = $1, lastname = $2, phone = $3, email = $4, address = $5 WHERE account_id = $6 RETURNING *",[firstname,lastname,phone,email,address,id]);
    console.log(updateData)
    res.json("Data was updated!");
  } catch (err) {
    console.error(err.message);
  }
});

//Clone Account
app.post("/cloneAccount/:id", async (req, res) => {
  try {    
    const { id } = req.params;
    const newData = await pool.query("INSERT INTO accounts(firstname,lastname,phone,email,address) SELECT firstname,lastname,phone,email,address FROM accounts WHERE account_id=$1", [id]);
    console.log(newData)
    res.json(newData.rows[0]);
  } catch (err) {
      console.error(err.message);
  }
});

///////////////////////////CONTACT/////////////////////////////////////

//get all Contact
app.get("/contacts", async (req, res) => {
    try {
        const allData = await pool.query("SELECT * FROM contacts");
        console.log(allData);
        res.json(allData.rows);   
    } catch (err) {
        console.error(err.message);
    }
});

//get Contacts related Account
app.get("/contacts/:id", async (req, res) => {
    try {
        const { id } = (req.params);
        const allData = await pool.query("SELECT * FROM contacts WHERE account_id = $1", [id]);
        console.log(allData);
        res.json(allData.rows);   
    } catch (err) {
        console.error(err.message);
    }
});

//create Contact
app.post("/createContact", async (req, res) => {
  try {    
    const { contact_fname,contact_lname,contact_phone,contact_email,account_id } = req.body;
    const newData = await pool.query("INSERT INTO contacts (contact_fname,contact_lname,contact_phone,contact_email,account_id) VALUES($1,$2,$3,$4,$5) RETURNING *",[contact_fname,contact_lname,contact_phone,contact_email,account_id]);
    console.log(newData)
    res.json(newData.rows[0]);
  } catch (err) {
      console.error(err.message);
  }
});

//update a Contact
app.put("/updatecontacts/:id", async (req, res) => {
  try {
    console.log('hi node !! req => ', req , '  res => ',res );
    const { id } = req.params;
    const { contact_fname,contact_lname,contact_phone,contact_email } = req.body;
    const updateData = await pool.query("UPDATE contacts SET contact_fname = $1, contact_lname = $2, contact_phone = $3, contact_email = $4 WHERE contact_id = $5 RETURNING *",[contact_fname,contact_lname,contact_phone,contact_email,id]);
    console.log(updateData)
    res.json("Data was updated!");
  } catch (err) {
    console.error(err.message);
  }
});

//delete a Contact
app.delete("/contacts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleteData = await pool.query("DELETE FROM contacts WHERE contact_id = $1", [id]);
      console.log(deleteData)
      res.json("data was deleted!");
    } catch (err) {
      console.log(err.message);
    }
  });

//Clone Contact
app.post("/cloneContact/:id", async (req, res) => {
  try {    
    const { id } = req.params;
    const newData = await pool.query("INSERT INTO contacts(contact_fname,contact_lname,contact_phone,contact_email,account_id) SELECT contact_fname,contact_lname,contact_phone,contact_email,account_id FROM contacts WHERE contact_id=$1", [id]);
    console.log(newData)
    res.json(newData.rows[0]);
  } catch (err) {
      console.error(err.message);
  }
});

///////////////////////////USER/////////////////////////////////////

//Image Upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '../client/public/uploads');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

//create Users
app.post("/createUser", upload.single('image'), async (req, res) => {
  try {   
    const image =  `/uploads/${req.file.filename}`; 
    const { name,phone,email,city,state,account_id,contact_id } = req.body;
    const newData = await pool.query("INSERT INTO users (name,phone,email,image,city,state,account_id,contact_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",[name,phone,email,image,city,state,account_id,contact_id]);
    console.log(newData)
    res.json(newData.rows[0]);
  } catch (err) {
      console.error(err.message);
  }
});

//get all Users 
app.get("/users", async (req, res) => {
  try {
      const allData = await pool.query("SELECT * FROM users");
      console.log(allData);
      res.json(allData.rows);   
  } catch (err) {
      console.error(err.message);
  }
});

//delete a User
app.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleteData = await pool.query("DELETE FROM users WHERE user_id = $1", [id]);
    console.log(deleteData)
    res.json("data was deleted!");
  } catch (err) {
    console.log(err.message);
  }
});

//update a User
app.put("/updateuser/:id", upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const image =  `/uploads/${req.file.filename}`;
    const {name,phone,email,city,state,account_id,contact_id } = req.body;
    const updateData = await pool.query("UPDATE accounts SET name = $1, phone = $2, email = $3, image = $4, city = $5, state = $6, account_id = $7, contact_id = $8 WHERE user_id = $9 RETURNING *",[name,phone,email,image,city,state,account_id,contact_id,id]);
    console.log(updateData)
    res.json("Data was updated!");
  } catch (err) {
    console.error(err.message);
  }
});

//Clone User
app.post("/cloneUser/:id", async (req, res) => {
  try {    
    const { id } = req.params;
    const newData = await pool.query("INSERT INTO users(name,phone,email,image,city,state,account_id,contact_id) SELECT name,phone,email,image,city,state,account_id,contact_id FROM users WHERE user_id=$1", [id]);
    console.log(newData)
    res.json(newData.rows[0]);
  } catch (err) {
      console.error(err.message);
  }
});

///////////////////////////Opportunity/////////////////////////////////////

//create Opportunity
app.post("/createOpportunity", async (req, res) => {
  try {    
    const { name,phone,email,account_id,contact_id,gender,hobbies } = req.body;
    const newData = await pool.query("INSERT INTO opportunity (name,phone,email,account_id,contact_id,gender,hobbies) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *",[name,phone,email,account_id,contact_id,gender,hobbies]);
    console.log(newData)
    res.json(newData.rows[0]);
  } catch (err) {
      console.error(err.message);
  }
});

//get all Opportunity 
app.get("/opportunity", async (req, res) => {
  try {
      const allData = await pool.query("SELECT * FROM opportunity");
      console.log(allData);
      res.json(allData.rows);   
  } catch (err) {
      console.error(err.message);
  }
});

//update Opportunity
app.put("/updateopportunity/:id" , async (req, res) => {
  try {
    const { id } = req.params;
    const {name,phone,email,account_id,contact_id,gender,hobbies} = req.body;
    const updateData = await pool.query("UPDATE opportunity SET name = $1, phone = $2, email = $3, account_id = $4, contact_id = $5, gender = $6, hobbies = $7 WHERE opportunity_id = $8 RETURNING *",[name,phone,email,account_id,contact_id,gender,hobbies,id]);
    console.log(updateData)
    res.json("Data was updated!");
  } catch (err) {
    console.error(err.message);
  }
});

//get Opportunity by Id
app.get("/opendetail/:id", async (req, res) => {
    try {
        const { id } = (req.params);  
        const data = await pool.query("SELECT * FROM opportunity WHERE opportunity_id = $1", [id])
        res.json(data.rows[0]);
    } catch (err) {
        console.error(err.message);
    }
});

//delete a Opportunity
app.delete("/deleteopp/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleteData = await pool.query("DELETE FROM opportunity WHERE opportunity_id = $1", [id]);
    console.log(deleteData)
    res.json("data was deleted!");
  } catch (err) {
    console.log(err.message);
  }
});

//get Opportunity related Account
app.get("/opportunitys/:id", async (req, res) => {
  const { id } = (req.params);
  try {
      const { rows }  = await pool.query("SELECT * FROM opportunity WHERE account_id = $1", [id]); 
      res.json(rows[0]); 
  } catch (err) {
      console.error(err.message);
  }
});

app.listen(serverval, () => {
	console.log("server has starting on port serverval");
});








  //get a Contact
// app.get("/onecontacts/:id", async (req, res) => {
//     try {
//         const { id } = (req.params);  
//         const data = await pool.query("SELECT * FROM contacts WHERE contact_id = $1", [id])
//         res.json(data.rows[0]);
//     } catch (err) {
//         console.error(err.message);
//     }
// });