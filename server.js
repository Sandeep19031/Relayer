const Forwading = require("./forward");
const mysql = require("mysql");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();

const path = require("path");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

const port = process.env.PORT || 3001;

const connection = mysql.createConnection({
  host: process.env.DATABASE_URL,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  port: process.env.DATABASE_PORT,
  database: process.env.DATABASE_NAME,
});
connection.connect((err) => {
  if (err) throw err;
  console.log("Connected!");
});

const handleForwading = async (metaTxData) => {
  const res = await Forwading(metaTxData);
  return res;
};

//Relayer transaction

//create relayer table

app.post("/create_relayer_table", (_req, res) => {
  let query =
    "CREATE TABLE relayer(id int AUTO_INCREMENT, user_acc_addr VARCHAR(30),app_name VARCHAR(30), app_sc_addr VARCHAR(30), tx_hash VARCHAR(50), PRIMARY KEY(id) );";

  connection.query(query, (err, result) => {
    if (err) {
      console.log("Err msg", err);
      res.send("err in mysql database" + err);
    }
    res.send(result);
  });
});

app.post("/qv/cast_vote", async (_req, res) => {
  //console.log("req from qv_frontend", _req);

  try {
    console.log("/qv/cast_vote: body of req", _req);
    const metaTxData = _req.body;

    const { result, tx_hash, err } = await handleForwading(metaTxData);

    if (result) {
      console.log("Everything is good");

      let query = "INSERT INTO relayer SET ?";
      let data = {
        user_acc_addr: metaTxData.parts[1],
        app_name: "Quadratic Voting",
        app_sc_addr: metaTxData.parts[2],
        tx_hash: tx_hash,
      };
      connection.query(query, data, (err, result) => {
        if (err) throw err;
        console.log("result: ", result);
      });
      res.send({
        succ: true,
        tx_hash: tx_hash,
        err: null,
      });
    } else {
      console.log("Error in forwading", err);
      const obj = {
        succ: false,
        tx_hash: tx_hash,
        err: err,
      };
      res.send(obj);
    }
  } catch (err) {
    res.send("error in qv/cast_vote api " + err);
  }
});

// create users
app.get("/create_user_table", (_req, res) => {
  let query =
    "CREATE TABLE users(id int AUTO_INCREMENT, name VARCHAR(30), PRIMARY KEY(id) );";

  connection.query(query, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

// add user
app.post("/add_user", (req, res) => {
  console.log("here is incoming user", req.body);
  let user = req.body.user;

  let query = "INSERT INTO users SET ?";

  connection.query(query, user, (err, result) => {
    if (err) throw err;
    console.log(result);
    res.send("Successfully Added!!");
  });
});

// create voting table
app.get("/create_voting_table", (_req, res) => {
  let query =
    "CREATE TABLE votes(id int, cand1vote int UNSIGNED,cand2vote int UNSIGNED, cand3vote int UNSIGNED, cand4vote int UNSIGNED, cand5vote int, PRIMARY KEY(id) );";

  connection.query(query, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

// Store vote
app.post("/add_vote", (req, res) => {
  let votes = req.body.votes;

  let query = "INSERT INTO votes SET ?";
  console.log("here is incoming data,", req.body.votes);
  connection.query(query, votes, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

// get total votes
app.get("/get_total_votes", (_req, res) => {
  let query = `SELECT SUM(cand1vote) AS "totalCand1Vote", SUM(cand2vote) AS "totalCand2Vote", SUM(cand3vote) AS "totalCand3Vote", SUM(cand4vote) AS "totalCand4Vote", SUM(cand5vote) AS "totalCand5Vote" FROM votes`;
  console.log("total votes query has come");
  connection.query(query, (err, result) => {
    if (err) throw err;

    let data = result[0];
    console.log("this result will be send", data);
    res.send(data);
  });
});

app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.listen(port, () => {
  console.log("listening on PORT", port);
});
