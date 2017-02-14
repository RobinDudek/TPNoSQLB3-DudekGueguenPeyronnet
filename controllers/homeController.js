var router = require('express').Router();
var fs = require('fs');
var Person = require('../models/Person');

// Permet de créer une route qui map l'url "/" en GET
router.get('/', function(req, res) {
    var page = parseInt(req.query.page);
    var itemsSkip = 0;
    if(isNaN(page) || page < 1)
    {
        //res.redirect('home/?page=1');
        page=1;
    }
    // Permet de retrouver des résultats sur un modèle
    Person.count().then(function(count) {
        var nbPages = (count/100)+1;
        if(page>nbPages)
        {
            page = Math.round(nbPages);
        }
        itemsSkip = (page - 1) * 100;
        Person.find({}).skip(itemsSkip).limit(100).then(function(persons) {
        // Permet d'afficher une vue et de lui passer des paramètres
            console.log(nbPages + " " + page);
            res.render('home.ejs', { persons: persons, nbPages: nbPages, numPage: page});
        });
    });

});

router.get('/stats', function(req, res){
    var query = req.query.requete;
    if(query!="age" && query!="agebis" && query!="femme" && query!="ip" && query!="chiffre" && query!="pourcent")
    {
        query = "age";
    }
    //début check argument get requete html

    if(query == "age")
    {
    // Permet de retrouver des résultats sur un modèle
        Person.count().then(function(count) {
            Person.find({ gender: "Male", $and: [ { age: { $gt: 20, $lt: 40 } }, { $and: [ { company: { $in: ["Quamba", "Zoomcast"] } } ] } ] }).then(function(persons) {
                res.render('stats.ejs', { persons: persons, query: query});
            });
        });
    }
    else if(query == "agebis")
    {
    // Permet de retrouver des résultats sur un modèle
        Person.count().then(function(count) {
            Person.find({age:{ $not: {$gt: 20, $lt: 50}}}).then(function(persons) {
                res.render('stats.ejs', { persons: persons, query: query});
            });
        });
    }
    else if(query == "femme")
    {
    // Permet de retrouver des résultats sur un modèle
        Person.count().then(function(count) {
            Person.find({ gender: "Female", $and: [ { company: "Quire" } ] }).sort({ age: -1 }).limit(1).then(function(persons) {
                res.render('stats.ejs', { persons: persons, query: query});
            });
        });
    }
    else if(query == "ip")
    {
    // Permet de retrouver des résultats sur un modèle
        Person.count().then(function(count) {
            Person.find( { ip_address: {$regex: /\d{1,3}\.129\.\d{1,3}\.\d{1,3}/}}, {firstname: 1, _id:0}).then(function(persons) {
                res.render('stats.ejs', { persons: persons, query: query});
            });
        });
    }
    else if(query == "chiffre")
    {
    // Permet de retrouver des résultats sur un modèle
        Person.count().then(function(count) {
            Person.find({ email: {$regex: /\d/}}).count().then(function(persons) {
                res.render('stats.ejs', { persons: persons, query: query});
            });
        });
    }
    else if(query == "pourcent")
    {

    // Permet de retrouver des résultats sur un modèle
        Person.count().then(function(count) {
            Person.aggregate([
                {$group:
                    {
                        _id:"$company",
                        nbrFemmes:{$sum: {$cond: {if: {$eq:["$gender","Female"]}, then:1, else:0 } } },
                        totalPersonnes:{$sum:1},
                    }    
                },
                {$project:
                    {
                        _id:0,
                        company:"$_id",
                        percent:{$divide:["$nbrFemmes","$totalPersonnes"]}
                    }
                },
                {$sort:{percent:-1}},
                {$limit:1}
            ]).then(function(company) {
                res.render('stats.ejs', { company: company, query: query});
            });
        });
    }
});

router.get('/loadData', function(req, res) {
    var nbLines = 0;
    fs.readFile('data/persons.csv', 'utf8', (err, data) => {
        if (err) throw err;
        var lines = data.split("\n");
        nbLines++;
        //Apparament c'est le même fonctionnement qu'un foreach
        for(var i in lines)
        {
            var line = lines[i];
            var lineData = line.split(",");
            var newPerson = new Person({
                "firstname": lineData[0],
                "lastname": lineData[1],
                "gender": lineData[2],
                "age": lineData[3],
                "company": lineData[4],
                "departement": lineData[5],
                "email": lineData[6],
                "city": lineData[7],
                "country": lineData[8],
                "ip_address": lineData[9]
            });
            newPerson.save();
        }
        console.log(nbLines);
    });
    console.log(nbLines);
    res.render('loadData.ejs', {nbLigne: nbLines});
});

// Permet de créer une route qui map l'url "/hello" en GET
router.get('/hello', function(req, res) {
    var p = new Person({
        firstname: 'Ted',
        lastname: 'Mosby',
        age: 30
    });

    // Permet d'insérer une nouvelle donnée
    p.save().then(function(personSaved){
        res.render('hello.ejs', personSaved);
    });
});

router.get('/add', function(req, res) {
    res.render('add.ejs');
});

router.post('/add', function(req, res) {
    var body = req.body;
    console.log(req.body);
    //check si les champs sont nul à faire

    var firstname = req.body.firstname;
    var lastname = req.body.lastname;
    var gender = req.body.gender;
    var age = req.body.age;
    var company = req.body.company;
    var departement = req.body.departement;
    var email = req.body.email;
    var city = req.body.city;
    var country = req.body.country;
    var ip_address = req.body.ip_address;

    var p = new Person({
        "firstname": firstname,
        "lastname": lastname,
        "gender": gender,
        "age": age,
        "company": company,
        "departement": departement,
        "email": email,
        "city": city,
        "country": country,
        "ip_address": ip_address
    });
    p.save();

    res.redirect('add');
});


module.exports = router;
