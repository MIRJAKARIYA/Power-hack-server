const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const passport = require("passport");
const { MongoClient, ServerApiVersion } = require("mongodb");
const bcrypt = require("bcrypt");
const initializePassport = require('./passport-config');



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


    initializePassport(passport,
      email => usersCollection.findOne(email)
    )


    app.post("/register", async (req, res) => {
      const query = { email: req.body.email };

      try {
        const isExists = await usersCollection.findOne(query);
        if (isExists) {
          res.send({acknowledged:false,mgs:'User already exists'});
        } else {
          const hashedPassword = await bcrypt.hash(req.body.password, 10);
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
