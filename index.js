const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");


const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

//verify JWT token
const verifyToken = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ authorization: false, message: "Unauthorized access" });
  }

  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(403)
        .send({ authorization: false, message: "Forbidded access" });
    }
    req.decoded = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.y9xgm.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const run = async () => {
  try {
    await client.connect();
    //users collection
    const usersCollection = client.db("power-hack-db").collection("users");
    const informationCollection = client.db("power-hack-db").collection("informations");


    //user login
    app.post("/api/login", async(req, res)=>{
      const userEmail = req.body.email;
      const userPassword = req.body.password;
      const isExists = await usersCollection.findOne({email:userEmail});
      if(isExists){
        try{
          const isValid = await bcrypt.compare(userPassword, isExists.password)
          if(isValid){
            const token = jwt.sign({email:userEmail},process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1d'})
            res.send({acknowledged:true,token,mgs:'success'})
          }
          else{
            res.send({acknowledged:false,mgs:'password incorrect'})
          }
        }
        catch{
          res.status(500).send()
        }
      }
      else{
        res.send({acknowledged:false,mgs:'email is not registered'})
      }

    })

    //user registration
    app.post("/api/registration", async (req, res) => {
      const query = { email: req.body.email };

      try {
        const isExists = await usersCollection.findOne(query);
        if (isExists) {
          res.send({acknowledged:false,mgs:'User already exists'});
        } else {
          const salt = await bcrypt.genSalt();
          const hashedPassword = await bcrypt.hash(req.body.password, salt);
          const user = {
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
          };
          const result = await usersCollection.insertOne(user);
          res.send(result);
        }
      } catch {}
    });


    //varifying if the user is valid
    app.post("/api/isValidUser", verifyToken,(req,res)=>{
      const email = req.query.email;
      const decodedEmail = req.decoded.email;

      if(email === decodedEmail){
        res.send({ authorization: true, message: "Access given" })
      }
      else{
        res.send({ authorization: false, message: "Access denied" })
      }
    })


    //add billing to the database
    app.put("/api/add-billing", async(req, res)=>{
      const billing = req.body;
      
    })

    //get all billing from the database
    app.get("/api/billing-list", async(req, res)=>{
      const billigList =await informationCollection.find({}).toArray()
      res.send(billigList)
    })

    //update single billing
    app.put("/api/update-billing/:id",async(req, res)=>{
        const id = req.params.id;
        const updatedData = req.body;
        console.log(updatedData)
        const filter = { _id: ObjectId(id) };
        const options = { upsert: true };
        const updatedDoc = {
          $set: {
            FullName: req.body.FullName,
            Email:req.body.Email,
            Phone: req.body.Phone,
            PaidAmount: req.body.PaidAmount
          },
        };
        const result = await informationCollection.updateOne(
          filter,
          updatedDoc,
          options
        );
        res.send(result);
      });
      
    app.post("/api/add-billing",async(req, res)=>{
        const data = req.body

        const result = await informationCollection.insertOne(data);
        res.send(result)

      });


    //delete single billing billing
    app.delete("/api/update-billing/:id",async(req, res)=>{
      const id = req.params.id;
      const query = {_id:ObjectId(id)};
      const result = await informationCollection.deleteOne(query)
      res.send(result)
    })



  } finally {
  }
};
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello from the server");
});

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
