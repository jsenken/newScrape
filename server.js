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

mongoose.connect("mongodb://localhost/newScrape");

app.get("/scrape", function(req, res) {
    axios.get("http://www.espn.com/fantasy/football/").then(function(response) {
    var $ = cheerio.load(response.data);
    $("a.realStory").each(function(i,element) {
        var result = {};
        result.title = $(this)
        .text();
        result.link = $(this)
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
    });
  });

  app.get("/articles/:id", function(req, res) {
    db.Article.findOne({_id: req.params.id})
      .populate("notes")
      .then(function(dbArticle){
        res.json(dbArticle)
      })
  });

  app.post("/articles/:id", function(req, res) {
    db.Note.create(req.body)
      .then(function(dbNote){
        return db.Article.findOneAndUpdate({_id: req.params.id}, {note: dbNote._id}, {new: true});
      }).then(function(dbArticle) {
        res.json(dbArticle)
      })
  });
  
  // Start the server
  app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
  });