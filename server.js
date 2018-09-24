var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");
var db = require("./models");
var PORT = 3000;
var app = express();

app.use(logger("dev"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost/newScrape", { useNewUrlParser: true });

app.get("/scrape", function(req, res) {
    axios.get("http://www.espn.com/fantasy/football/").then(function(response) {
    var $ = cheerio.load(response.data);
    $("div.item-info-wrap").each(function(i,element) {
        var result = {};
        result.title = $(this).children("h1").children("a")
        .text();
        result.summary = $(this).children("p").text();
        // console.log(result.summary);
        result.link = $(this).children("h1").children("a")
        .attr("href");
        db.Article.create(result)
        .then(function(dbArticle) {
          console.log(dbArticle);
        })
        .catch(function(err) {
          return res.json(err);
        });
    });
    res.send("Scrape Complete");
});
});

app.get("/articles", function(req, res) {
    db.Article.find({}).then(function(dbArticle){
      res.json(dbArticle)
    }).catch(function(err) {
      res.json(err);
    });
  });

  app.get("/articles/:id", function(req, res) {
    db.Article.findOne({_id: req.params.id})
      .populate("note")
      .then(function(dbArticle){
        res.json(dbArticle)
      }).catch(function(err){
        res.json(err);
      });
  });

  app.post("/articles/:id", function(req, res) {
    db.Note.create(req.body)
      .then(function(dbNote){
        return db.Article.findOneAndUpdate({_id: req.params.id}, {note: dbNote._id}, {new: true});
      }).then(function(dbArticle) {
        res.json(dbArticle)
      }).catch(function(err){
        res.json(err);
      })
  });
  
  // Start the server
  app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
  });